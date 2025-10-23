"""
Configuration and initialization for Recipe Recommender API
"""

import os
import warnings
from typing import Dict, Optional
from dotenv import load_dotenv

# LangChain imports
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_postgres.vectorstores import PGVector
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import psycopg
from sqlalchemy import create_engine, text

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
recipe_vector_store: Optional[PGVector] = None
stable_diffusion_pipe = None
IMAGE_GENERATION_ENABLED = False
connection_string: Optional[str] = None

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
        model="gemini-2.0-flash-exp",
        google_api_key=GOOGLE_API_KEY
    )
    
    vision_llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key=GOOGLE_API_KEY
    )
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=GOOGLE_API_KEY
    )
    
    print("✅ AI Models initialized successfully!")

def load_recipe_vector_store(pdf_directory="../Pdfs"):
    """Load or create Supabase PGVector store from recipe PDFs"""
    global recipe_vector_store, connection_string
    
    print("\n🗄️ Setting up Supabase PostgreSQL vector store...")
    
    # Get Supabase credentials
    supabase_password = os.environ.get("SUPABASE_PASSWORD")
    supabase_url = os.environ.get("SUPABASE_OG_URL")
    
    if not supabase_password or not supabase_url:
        print("❌ Missing SUPABASE_PASSWORD or SUPABASE_OG_URL in .env file")
        return
    
    # Parse the Supabase URL to extract connection details
    # Format: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
    try:
        import re
        match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', supabase_url)
        if match:
            user, password, host, port, dbname = match.groups()
            # Use the password from env variable as it's more reliable
            connection_string = f"postgresql+psycopg://{user}:{supabase_password}@{host}:{port}/{dbname}"
        else:
            # Fallback: just replace postgresql:// with postgresql+psycopg://
            connection_string = supabase_url.replace("postgresql://", "postgresql+psycopg://")
    except Exception as e:
        print(f"⚠️  Error parsing Supabase URL: {e}")
        connection_string = supabase_url.replace("postgresql://", "postgresql+psycopg://")
    
    print(f"   📡 Connection string: {connection_string.replace(supabase_password, '***')}")
    
    collection_name = "recipe_embeddings"
    
    try:
        # Test connection and enable vector extension using psycopg (v3)
        test_conn = psycopg.connect(supabase_url)
        with test_conn.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        test_conn.commit()
        test_conn.close()
        print("   ✅ Connected to Supabase and enabled vector extension.")
        
    except Exception as e:
        print(f"   ⚠️  Could not enable vector extension: {e}")
        print("   💡 Make sure to run the SQL commands in 'supabase_vector_setup.sql' in your Supabase SQL Editor")
        print("   Continuing anyway...")
    
    # Initialize PGVector
    try:
        recipe_vector_store = PGVector(
            embeddings=embeddings,
            connection=connection_string,
            collection_name=collection_name,
            use_jsonb=True
        )
        print("   ✅ Vector store connection successful.")
        
    except Exception as e:
        print(f"   ❌ Failed to initialize PGVector: {e}")
        return
    
    # Now check if we need to load PDFs
    if not os.path.exists(pdf_directory):
        print(f"⚠️  PDF directory '{pdf_directory}' not found.")
        print("   Vector store initialized but no documents loaded.")
        return
    
    pdf_files = [f for f in os.listdir(pdf_directory) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"⚠️  No PDF files found in '{pdf_directory}'.")
        print("   Vector store initialized but no documents loaded.")
        return
    
    # Check existing PDFs in database
    existing_pdfs = set()
    try:
        engine = create_engine(connection_string)
        with engine.connect() as conn:
            result = conn.execute(text(f"""
                SELECT DISTINCT cmetadata->>'source' as source
                FROM langchain_pg_embedding
                WHERE cmetadata->>'source' IS NOT NULL
                AND collection_id = (SELECT uuid FROM langchain_pg_collection WHERE name = '{collection_name}')
            """))
            for row in result:
                if row[0]:
                    # Extract just the filename from the full path
                    existing_pdfs.add(os.path.basename(row[0]))
        print(f"   - Found {len(existing_pdfs)} PDF sources in database: {existing_pdfs}")
    except Exception as e:
        print(f"   - Could not check existing PDFs: {e}")
        existing_pdfs = set()
    
    # Check for removed PDFs
    removed_pdfs = existing_pdfs - set(pdf_files)
    if removed_pdfs:
        print(f"   🗑️ Detected {len(removed_pdfs)} removed PDF(s): {list(removed_pdfs)}")
        try:
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                for pdf in removed_pdfs:
                    conn.execute(text(f"""
                        DELETE FROM langchain_pg_embedding
                        WHERE cmetadata->>'source' LIKE '%{pdf}'
                        AND collection_id = (SELECT uuid FROM langchain_pg_collection WHERE name = '{collection_name}')
                    """))
                    conn.commit()
                    print(f"      ✅ Removed embeddings for: {pdf}")
        except Exception as e:
            print(f"      ⚠️  Error removing old PDFs: {e}")
    
    # Only process new PDFs
    pdfs_to_process = [pdf for pdf in pdf_files if pdf not in existing_pdfs]
    
    if not pdfs_to_process:
        print("   ✅ All PDFs are up-to-date. No new documents to add.")
        return
    
    print(f"   📚 Processing {len(pdfs_to_process)} new PDF(s): {pdfs_to_process}")
    
    # Load and process PDFs
    all_docs = []
    for pdf_file in pdfs_to_process:
        pdf_path = os.path.join(pdf_directory, pdf_file)
        print(f"   - Loading: {pdf_file}")
        try:
            loader = PyPDFDirectoryLoader(os.path.dirname(pdf_path))
            docs = loader.load()
            # Filter to only this PDF
            filtered_docs = [doc for doc in docs if os.path.basename(doc.metadata.get('source', '')) == pdf_file]
            all_docs.extend(filtered_docs)
            print(f"      ✅ Loaded {len(filtered_docs)} pages")
        except Exception as e:
            print(f"      ⚠️  Error loading {pdf_file}: {e}")
    
    if not all_docs:
        print("   - Could not load any content from the PDF files.")
        return
    
    # Split documents into chunks
    print(f"   - Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
    )
    all_splits = text_splitter.split_documents(all_docs)
    
    # Add instruction prefix for better embedding quality
    docs_to_embed = [
        Document(
            page_content=f"Represent this recipe document for retrieval: {doc.page_content}",
            metadata=doc.metadata,
        ) for doc in all_splits
    ]
    
    # Add documents to vector store
    print(f"   - Adding {len(docs_to_embed)} chunks to vector store...")
    try:
        recipe_vector_store.add_documents(docs_to_embed)
        print(f"   ✅ Added {len(all_splits)} chunks from {len(pdfs_to_process)} new PDF(s).")
    except Exception as e:
        print(f"   ❌ Error adding documents: {e}")

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