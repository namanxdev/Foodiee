"""
FastAPI Backend for Recipe Recommendation System with RAG + Image Generation
"""

# Fix macOS OpenMP duplicate initialization error
import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import warnings
from io import BytesIO
import base64

# LangChain imports
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

warnings.filterwarnings('ignore')
load_dotenv()

# ============================================================
# FastAPI App Setup
# ============================================================
app = FastAPI(
    title="Recipe Recommender API",
    description="AI-powered recipe recommendation with RAG and image generation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Pydantic Models for Request/Response
# ============================================================

class UserPreferencesRequest(BaseModel):
    region: str
    taste_preferences: List[str]
    meal_type: str
    time_available: str
    allergies: Optional[List[str]] = []
    dislikes: Optional[List[str]] = []
    available_ingredients: List[str]

class RecipeRecommendationResponse(BaseModel):
    recommendations: str
    success: bool
    message: str
    session_id: str  # Add session_id as separate field for easy access

class RecipeDetailRequest(BaseModel):
    recipe_name: str

class RecipeDetailResponse(BaseModel):
    recipe_name: str
    ingredients: str
    steps: List[str]
    tips: str
    success: bool

class StepImageRequest(BaseModel):
    recipe_name: str
    step_description: str

class ImageGenerationResponse(BaseModel):
    image_data: Optional[str] = None  # Base64 encoded image
    description: str
    success: bool
    generation_type: str  # "gpu", "text_only"

class IngredientAlternativesRequest(BaseModel):
    missing_ingredient: str
    recipe_context: str

class IngredientAlternativesResponse(BaseModel):
    alternatives: str
    success: bool

# ============================================================
# Global Variables for Session State
# ============================================================

# Store user sessions (in production, use Redis or database)
user_sessions: Dict[str, dict] = {}

# AI Models
llm = None
vision_llm = None
embeddings = None
recipe_vector_store = None
stable_diffusion_pipe = None
IMAGE_GENERATION_ENABLED = False

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
        from diffusers import StableDiffusionPipeline
        
        if not torch.cuda.is_available():
            print("⚠️  CUDA not available. Image generation will use text descriptions only.")
            return
        
        print("🎮 GPU detected! Initializing Stable Diffusion...")
        
        device = "cuda"
        dtype = torch.float16
        model_id = "runwayml/stable-diffusion-v1-5"
        
        stable_diffusion_pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            safety_checker=None,
            requires_safety_checker=False
        )
        print(stable_diffusion_pipe)
        stable_diffusion_pipe = stable_diffusion_pipe.to(device)
        stable_diffusion_pipe.enable_attention_slicing()
        stable_diffusion_pipe.enable_vae_slicing()
        
        IMAGE_GENERATION_ENABLED = True
        print("✅ Image generation enabled with GPU!")
        
    except ImportError:
        print("⚠️  PyTorch/Diffusers not installed. Image generation disabled.")
    except Exception as e:
        print(f"⚠️  Could not initialize image generation: {e}")

# ============================================================
# Recipe Recommender Class
# ============================================================

class RecipeRecommender:
    def __init__(self):
        self.llm = llm
        self.vision_llm = vision_llm
        self.vector_store = recipe_vector_store
        
        # Prompts
        self.recipe_prompt_with_rag = ChatPromptTemplate.from_messages([
            ("system", "You are an expert chef and nutritionist. Based on the user's preferences and the recipe knowledge base, recommend 3 suitable recipes."),
            ("user", """Recipe Knowledge Base:
{context}

User Preferences:
{preferences}

For each recipe, provide:
1. Recipe Name
2. Brief description (1-2 sentences)
3. Main ingredients needed
4. Estimated cooking time
5. Why it matches their preferences

IMPORTANT: Prioritize recipes from the knowledge base above. If the knowledge base doesn't have suitable recipes, you may suggest alternatives.
Format your response clearly with numbered recipes.""")
        ])
        
        self.recipe_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert chef and nutritionist."),
            ("user", """Based on the user's preferences below, recommend 3 suitable recipes.

{preferences}

For each recipe, provide:
1. Recipe Name
2. Brief description (1-2 sentences)
3. Main ingredients needed
4. Estimated cooking time
5. Why it matches their preferences

Format your response clearly with numbered recipes.""")
        ])
        
        self.detail_prompt_with_rag = ChatPromptTemplate.from_messages([
            ("system", "You are an expert chef. Provide detailed step-by-step recipes."),
            ("user", """Provide a detailed step-by-step recipe for: {recipe_name}

Recipe Knowledge Base:
{context}

User preferences and constraints:
{preferences}

Provide:
1. Complete ingredient list with quantities
2. Clear step-by-step cooking instructions (numbered - EACH STEP ON A NEW LINE starting with "STEP X:")
3. Cooking tips
4. Total time required

IMPORTANT: If the recipe is found in the knowledge base above, use that information. Otherwise, create a suitable recipe.
Format each cooking step on a new line starting with "STEP 1:", "STEP 2:", etc.
Make the instructions clear and easy to follow.""")
        ])
        
        self.detail_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert chef."),
            ("user", """Provide a detailed step-by-step recipe for: {recipe_name}

User preferences and constraints:
{preferences}

Provide:
1. Complete ingredient list with quantities
2. Clear step-by-step cooking instructions (numbered - EACH STEP ON A NEW LINE starting with "STEP X:")
3. Cooking tips
4. Total time required

IMPORTANT: Format each cooking step on a new line starting with "STEP 1:", "STEP 2:", etc.
Make the instructions clear and easy to follow.""")
        ])
        
        self.alternative_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert chef who suggests ingredient alternatives."),
            ("user", """Suggest 3 good alternatives for the ingredient: {missing_ingredient}

Recipe context: {recipe_context}

For each alternative, explain:
- What it is
- How to use it as a substitute
- How it will affect the taste

Keep suggestions practical and commonly available.""")
        ])
        
        self.sd_image_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert at creating concise, effective image generation prompts for food photography."),
            ("user", """Create a SHORT image generation prompt (max 60 words) for Stable Diffusion:

Recipe: {recipe_name}
Step: {step_description}

Make it:
- Professional food photography style
- Clear and specific about the cooking action
- Include lighting, angle, and composition details
- Photorealistic, appetizing, high quality
- NO explanations, just the prompt

Example: "Professional overhead shot of golden pakoras frying in hot oil, bubbles rising, warm kitchen lighting, shallow depth of field, steam visible, highly detailed, food photography"

Your prompt:""")
        ])
    
    def recommend_recipes(self, preferences_str: str):
        """Get recipe recommendations"""
        if self.vector_store:
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
            search_query = preferences_str[:200]  # Use part of preferences as search
            
            rag_chain = (
                {
                    "context": lambda x: "\n\n".join([doc.page_content for doc in retriever.invoke(x)]),
                    "preferences": lambda x: preferences_str
                }
                | self.recipe_prompt_with_rag
                | self.llm
                | StrOutputParser()
            )
            return rag_chain.invoke(search_query)
        else:
            chain = self.recipe_prompt | self.llm | StrOutputParser()
            return chain.invoke({"preferences": preferences_str})
    
    def get_detailed_recipe(self, recipe_name: str, preferences_str: str):
        """Get detailed recipe instructions"""
        if self.vector_store:
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
            
            rag_chain = (
                {
                    "context": lambda x: "\n\n".join([doc.page_content for doc in retriever.invoke(recipe_name)]),
                    "recipe_name": lambda x: recipe_name,
                    "preferences": lambda x: preferences_str
                }
                | self.detail_prompt_with_rag
                | self.llm
                | StrOutputParser()
            )
            return rag_chain.invoke(recipe_name)
        else:
            chain = self.detail_prompt | self.llm | StrOutputParser()
            return chain.invoke({
                "recipe_name": recipe_name,
                "preferences": preferences_str
            })
    
    def parse_recipe_steps(self, recipe_text: str):
        """Parse recipe into structured format"""
        lines = recipe_text.split('\n')
        steps = []
        ingredients_section = []
        tips_section = []
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if 'ingredient' in line.lower() and ':' in line:
                current_section = 'ingredients'
                continue
            elif 'step' in line.lower() and ':' in line.lower() and any(char.isdigit() for char in line):
                current_section = 'steps'
            elif 'tip' in line.lower() and ':' in line.lower():
                current_section = 'tips'
                continue
            
            if current_section == 'steps' and line.startswith(('STEP', 'Step', '**STEP', '**Step')):
                steps.append(line)
            elif current_section == 'ingredients':
                ingredients_section.append(line)
            elif current_section == 'tips':
                tips_section.append(line)
        
        return {
            'ingredients': '\n'.join(ingredients_section),
            'steps': steps,
            'tips': '\n'.join(tips_section)
        }
    
    def generate_image_prompt(self, recipe_name: str, step_description: str):
        """Generate image prompt for Stable Diffusion"""
        chain = self.sd_image_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "recipe_name": recipe_name,
            "step_description": step_description
        }).strip()
    
    def generate_image(self, recipe_name: str, step_description: str):
        """Generate image using Stable Diffusion"""
        global IMAGE_GENERATION_ENABLED, stable_diffusion_pipe
        
        # Generate prompt
        image_prompt = self.generate_image_prompt(recipe_name, step_description)
        
        if not IMAGE_GENERATION_ENABLED or stable_diffusion_pipe is None:
            print("⚠️  Image generation not enabled or Stable Diffusion not initialized.")
            return None, image_prompt
        
        try:
            import torch
            import gc
            
            with torch.inference_mode():
                image = stable_diffusion_pipe(
                    image_prompt,
                    num_inference_steps=30,
                    guidance_scale=7.5,
                    height=512,
                    width=512
                ).images[0]
            
            torch.cuda.empty_cache()
            gc.collect()
            
            return image, image_prompt
        except Exception as e:
            print(f"Error generating image: {e}")
            return None, image_prompt
    
    def get_ingredient_alternatives(self, missing_ingredient: str, recipe_context: str):
        """Get ingredient alternatives"""
        chain = self.alternative_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "missing_ingredient": missing_ingredient,
            "recipe_context": recipe_context
        })

# Global recommender instance
recommender = None

# ============================================================
# Helper Functions
# ============================================================

def get_session_history(session_id: str) -> List[Dict]:
    """
    Retrieve complete step history for a session.
    Returns list of step objects from start to current position.
    
    Example:
        history = get_session_history("session_abc123")
        # Returns: [
        #     {"step_number": 1, "step_text": "STEP 1: ...", "timestamp": "2025-10-22T...", "image_generated": false, "image_prompt": null},
        #     {"step_number": 2, "step_text": "STEP 2: ...", "timestamp": "2025-10-22T...", "image_generated": true, "image_prompt": "..."},
        # ]
    """
    if session_id not in user_sessions:
        return []
    
    session = user_sessions[session_id]
    return session.get("recipe_history", [])

@app.get("/api/history/{session_id}")
async def get_recipe_history(session_id: str):
    """
    API endpoint to retrieve the complete step history for a session.
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = get_session_history(session_id)
    
    return {
        "session_id": session_id,
        "history": history,
        "total_steps": len(history),
        "success": True
    }

def get_session_history_text(session_id: str) -> str:
    """
    Get formatted text of all completed steps for context (useful for prompts).
    """
    history = get_session_history(session_id)
    if not history:
        return "No steps completed yet."
    
    text_parts = ["Previously completed steps:"]
    for entry in history:
        text_parts.append(f"- {entry['step_text']}")
    
    return "\n".join(text_parts)

# ============================================================
# Startup Event
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize all components on startup"""
    global recommender
    
    print("🚀 Starting Recipe Recommender API...")
    
    try:
        initialize_ai_models()
        load_recipe_vector_store()
        initialize_image_generation()
        
        recommender = RecipeRecommender()
        
        print("✅ API is ready!")
        print(f"✅ RAG Status: {'Enabled' if recipe_vector_store else 'Disabled'}")
        print(f"✅ Image Generation: {'GPU-Enabled' if IMAGE_GENERATION_ENABLED else 'Text-Only'}")
    except Exception as e:
        print(f"❌ Startup error: {e}")
        raise

# ============================================================
# API Routes
# ============================================================

@app.get("/")
async def root():
    """API health check"""
    return {
        "message": "Recipe Recommender API is running!",
        "version": "1.0.0",
        "rag_enabled": recipe_vector_store is not None,
        "image_generation": "gpu" if IMAGE_GENERATION_ENABLED else "text_only"
    }

@app.post("/api/preferences", response_model=RecipeRecommendationResponse)
async def submit_preferences(preferences: UserPreferencesRequest):
    """
    Submit user preferences and get recipe recommendations
    """
    try:
        # Create unique session ID
        import uuid
        session_id = f"session_{uuid.uuid4().hex[:8]}"
        
        # Format preferences
        preferences_str = f"""
User Preferences:
- Region/Cuisine: {preferences.region}
- Taste Preferences: {', '.join(preferences.taste_preferences)}
- Meal Type: {preferences.meal_type}
- Time Available: {preferences.time_available}
- Allergies: {', '.join(preferences.allergies) if preferences.allergies else 'None'}
- Dislikes: {', '.join(preferences.dislikes) if preferences.dislikes else 'None'}
- Available Ingredients: {', '.join(preferences.available_ingredients)}
"""
        
        # Store in session
        user_sessions[session_id] = {
            "preferences": preferences_str,
            "current_recipe": None,
            "current_step_index": 0,
            "recipe_steps": [],
            "recipe_history": []  # ✨ Track all completed steps
        }
        
        # Get recommendations
        recommendations = recommender.recommend_recipes(preferences_str)
        
        return RecipeRecommendationResponse(
            recommendations=recommendations,
            success=True,
            message=f"Recommendations generated successfully! Use the session_id below for all subsequent requests.",
            session_id=session_id  # Return session_id as separate field!
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/recipe/details", response_model=RecipeDetailResponse)
async def get_recipe_details(request: RecipeDetailRequest, session_id: str):
    """
    Get detailed recipe instructions
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        preferences_str = session["preferences"]
        
        # Get detailed recipe
        detailed_recipe = recommender.get_detailed_recipe(request.recipe_name, preferences_str)
        
        # Parse recipe
        parsed = recommender.parse_recipe_steps(detailed_recipe)
        
        # Update session
        session["current_recipe"] = request.recipe_name
        session["recipe_steps"] = parsed["steps"]
        session["current_step_index"] = 0
        session["ingredients"] = parsed["ingredients"]
        session["tips"] = parsed["tips"]
        session["recipe_history"] = []  # Reset history for new recipe
        
        return RecipeDetailResponse(
            recipe_name=request.recipe_name,
            ingredients=parsed["ingredients"],
            steps=parsed["steps"],
            tips=parsed["tips"],
            success=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/step/next")
async def next_step(session_id: str):
    """
    Move to the next cooking step
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        
        if not session["recipe_steps"]:
            raise HTTPException(status_code=400, detail="No recipe loaded")
        
        current_index = session["current_step_index"]
        steps = session["recipe_steps"]
        
        if current_index >= len(steps):
            print({
                "step": None,
                "step_number": current_index,
                "total_steps": len(steps),
                "completed": True,
                "message": "All steps completed!",
                "tips": session.get("tips", "")
            })
            return {
                "step": None,
                "step_number": current_index,
                "total_steps": len(steps),
                "completed": True,
                "message": "All steps completed!",
                "tips": session.get("tips", "")
            }
        
        current_step = steps[current_index]
        session["current_step_index"] = current_index + 1
        
        # Add to history
        from datetime import datetime
        history_entry = {
            "step_number": current_index + 1,
            "step_text": current_step,
            "timestamp": datetime.now().isoformat(),
            "image_generated": False,
            "image_prompt": None
        }
        session["recipe_history"].append(history_entry)
        
        print({
            "step": current_step,
            "step_number": current_index + 1,
            "total_steps": len(steps),
            "completed": False,
            "message": "Success"
        })
        
        return {
            "step": current_step,
            "step_number": current_index + 1,
            "total_steps": len(steps),
            "completed": False,
            "message": "Success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/step/image", response_model=ImageGenerationResponse)
async def generate_step_image(session_id: str):
    """
    Generate image for current cooking step
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        
        if not session["recipe_steps"]:
            raise HTTPException(status_code=400, detail="No recipe loaded")
        
        current_index = session["current_step_index"]
        if current_index == 0:
            current_index = 1  # If they haven't called next yet, show first step
        
        steps = session["recipe_steps"]
        if current_index > len(steps):
            raise HTTPException(status_code=400, detail="No more steps")
        
        current_step = steps[current_index - 1]
        recipe_name = session["current_recipe"]
        
        # Get history context
        history_text = get_session_history_text(session_id)
        
        # Generate image
        image, description = recommender.generate_image(recipe_name, current_step)
        
        # Update history to mark image was generated for this step
        if session["recipe_history"] and session["recipe_history"][-1]["step_number"] == current_index:
            session["recipe_history"][-1]["image_generated"] = True
            session["recipe_history"][-1]["image_prompt"] = description
        
        if image:
            # Convert PIL image to base64
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return ImageGenerationResponse(
                image_data=img_str,
                description=description,
                success=True,
                generation_type="gpu"
            )
        else:
            # Text description only
            return ImageGenerationResponse(
                image_data=None,
                description=description,
                success=True,
                generation_type="text_only"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/step/skip")
async def skip_to_alternatives(session_id: str):
    """
    Skip remaining steps and go to ingredient alternatives
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        steps = session["recipe_steps"]
        
        # Mark as completed
        session["current_step_index"] = len(steps) + 1
        
        return {
            "message": "Skipped to ingredient alternatives section",
            "success": True,
            "tips": session.get("tips", "")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/ingredients/alternatives", response_model=IngredientAlternativesResponse)
async def get_alternatives(request: IngredientAlternativesRequest, session_id: str):
    """
    Get alternatives for missing ingredients
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        recipe_name = session.get("current_recipe", request.recipe_context)
        
        alternatives = recommender.get_ingredient_alternatives(
            request.missing_ingredient,
            recipe_name
        )
        
        return IngredientAlternativesResponse(
            alternatives=alternatives,
            success=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/session/{session_id}")
async def get_session_info(session_id: str):
    """
    Get current session information
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = user_sessions[session_id]
    
    return {
        "session_id": session_id,
        "current_recipe": session.get("current_recipe"),
        "current_step": session.get("current_step_index", 0),
        "total_steps": len(session.get("recipe_steps", [])),
        "has_recipe": session.get("current_recipe") is not None
    }

@app.get("/api/session/{session_id}/history")
async def get_session_step_history(session_id: str):
    """
    Get complete step history for a session.
    Returns all steps completed from start to current position with metadata.
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = get_session_history(session_id)
    
    return {
        "session_id": session_id,
        "history": history,
        "total_completed_steps": len(history),
        "success": True
    }

@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del user_sessions[session_id]
    
    return {
        "message": "Session deleted successfully",
        "success": True
    }

# ============================================================
# Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print("="*60)
    print("🍳 Recipe Recommender API with RAG + Image Generation")
    print("="*60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        # reload=True
    )
