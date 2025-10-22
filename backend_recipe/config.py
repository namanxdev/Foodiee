"""
Configuration and initialization for Recipe Recommender API
"""

import os
import warnings
from typing import Dict, Optional
from dotenv import load_dotenv

# LangChain imports
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Fix macOS OpenMP duplicate initialization error
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
warnings.filterwarnings('ignore')
load_dotenv()

# ============================================================
# Global Variables
# ============================================================

# AI Models
llm: Optional[ChatGoogleGenerativeAI] = None
vision_llm: Optional[ChatGoogleGenerativeAI] = None
embeddings: Optional[GoogleGenerativeAIEmbeddings] = None
recipe_vector_store: Optional[FAISS] = None
stable_diffusion_pipe = None
IMAGE_GENERATION_ENABLED = False

# Store user sessions (in production, use Redis or database)
user_sessions: Dict[str, dict] = {}

# ============================================================
# Initialization Functions
# ============================================================

def initialize_ai_models():
    """Initialize all AI models and embeddings"""
    global llm, vision_llm, embeddings
    
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    # Initialize Gemini models
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=GOOGLE_API_KEY
    )
    
    vision_llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=GOOGLE_API_KEY
    )
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=GOOGLE_API_KEY
    )
    
    print("✅ AI Models initialized successfully!")

def load_recipe_vector_store(pdf_directory="../Pdfs", faiss_index_path="../recipe_faiss_index"):
    """Load or create FAISS vector store from recipe PDFs"""
    global recipe_vector_store
    
    # Check if FAISS index exists
    if os.path.exists(faiss_index_path):
        print(f"📦 Loading existing FAISS index from '{faiss_index_path}'...")
        try:
            recipe_vector_store = FAISS.load_local(
                faiss_index_path,
                embeddings,
                allow_dangerous_deserialization=True
            )
            print("✅ FAISS index loaded successfully!")
            return
        except Exception as e:
            print(f"⚠️  Error loading FAISS index: {e}")
            print("   Will try to rebuild from PDFs...")
    
    # If we reach here, either no index exists or loading failed
    # Now check for PDFs to build a new index
    if not os.path.exists(pdf_directory):
        print(f"⚠️  PDF directory '{pdf_directory}' not found. RAG disabled.")
        return
    
    pdf_files = [f for f in os.listdir(pdf_directory) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"⚠️  No PDF files found in '{pdf_directory}'. RAG disabled.")
        return
    
    print(f"📚 Loading {len(pdf_files)} PDF file(s)...")
    
    try:
        loader = PyPDFDirectoryLoader(pdf_directory)
        documents = loader.load()
        
        print(f"   Splitting documents...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(documents)
        
        print(f"   Creating FAISS vector store...")
        recipe_vector_store = FAISS.from_documents(splits, embeddings)
        
        # Create directory if it doesn't exist
        os.makedirs(faiss_index_path, exist_ok=True)
        
        print(f"   Saving to '{faiss_index_path}'...")
        recipe_vector_store.save_local(faiss_index_path)
        
        print(f"✅ Recipe vector store created with {len(splits)} chunks!")
    except Exception as e:
        print(f"❌ Error creating vector store: {e}")

def initialize_image_generation():
    """Initialize Stable Diffusion for image generation"""
    global IMAGE_GENERATION_ENABLED, stable_diffusion_pipe
    
    try:
        import torch
        import platform
        from diffusers import StableDiffusionPipeline
        
        # Detect device
        os_name = platform.system()
        device = None
        dtype = torch.float32
        
        if os_name == "Darwin" and torch.backends.mps.is_available():
            # macOS with Metal GPU
            device = "mps"
            print("🍎 macOS detected - Using Apple Metal Performance Shaders (MPS)")
            print("   • GPU acceleration enabled")
            
        elif torch.cuda.is_available():
            # Linux/Windows with NVIDIA GPU
            device = "cuda"
            dtype = torch.float16
            print(f"🎮 NVIDIA GPU detected - Using CUDA")
            print(f"   • GPU: {torch.cuda.get_device_name(0)}")
            print(f"   • VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
            
        else:
            print("⚠️  No GPU detected. Image generation will use CPU (very slow).")
            print("   Recommendation: Image generation requires GPU for reasonable performance")
            device = "cpu"
        
        print(f"\n📥 Loading Stable Diffusion model...")
        print(f"   (First time: ~4-5GB download)")
        
        model_id = "runwayml/stable-diffusion-v1-5"
        
        stable_diffusion_pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        stable_diffusion_pipe = stable_diffusion_pipe.to(device)
        
        # Enable memory optimizations
        if device in ["cuda", "mps"]:
            stable_diffusion_pipe.enable_attention_slicing()
            if device == "cuda":
                stable_diffusion_pipe.enable_vae_slicing()
            print(f"🔧 Memory optimizations enabled for {device}")
        
        IMAGE_GENERATION_ENABLED = True
        print(f"✅ Image generation enabled with {device}!")
        
    except ImportError:
        print("⚠️  PyTorch/Diffusers not installed. Image generation disabled.")
    except Exception as e:
        print(f"⚠️  Could not initialize image generation: {e}")

def initialize_all():
    """Initialize all components"""
    print("🚀 Initializing Recipe Recommender API...")
    
    try:
        initialize_ai_models()
        load_recipe_vector_store()
        initialize_image_generation()
        
        print("✅ All components initialized!")
        print(f"✅ RAG Status: {'Enabled' if recipe_vector_store else 'Disabled'}")
        print(f"✅ Image Generation: {'GPU-Enabled' if IMAGE_GENERATION_ENABLED else 'Text-Only'}")
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        raise

# ============================================================
# Getter Functions for Global Variables
# ============================================================

def get_llm():
    """Get the current LLM instance"""
    return llm

def get_vision_llm():
    """Get the current vision LLM instance"""
    return vision_llm

def get_recipe_vector_store():
    """Get the current recipe vector store instance"""
    return recipe_vector_store

def get_image_generation_enabled():
    """Get the current image generation status"""
    return IMAGE_GENERATION_ENABLED

def get_stable_diffusion_pipe():
    """Get the current stable diffusion pipeline"""
    return stable_diffusion_pipe