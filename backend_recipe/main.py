"""
FastAPI Backend for Recipe Recommendation System with RAG + Image Generation
"""

from fastapi import FastAPI

# Import modularized components
from config import (
    initialize_all, 
    recipe_vector_store, 
    IMAGE_GENERATION_ENABLED
)
from core import RecipeRecommender
from api import (
    preferences_router,
    recipes_router, 
    sessions_router,
    images_router
)
from api.preferences import set_recommender as set_preferences_recommender
from api.recipes import set_recommender as set_recipes_recommender
from api.images import set_recommender as set_images_recommender

# ============================================================
# FastAPI App Setup
# ============================================================
app = FastAPI(
    title="Recipe Recommender API",
    description="AI-powered recipe recommendation with RAG and image generation",
    version="1.0.0"
)

# Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global recommender instance
recommender = None

# ============================================================
# Startup Event
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize all components on startup"""
    global recommender
    
    print("🚀 Starting Recipe Recommender API...")
    
    try:
        # Initialize all components
        print("🔧 Initializing components...")
        initialize_all()
        
        # Create recommender instance
        print("🤖 Creating RecipeRecommender instance...")
        recommender = RecipeRecommender()
        print(f"✅ RecipeRecommender created: {recommender is not None}")
        
        # Set recommender in all API modules
        print("🔗 Setting recommender in API modules...")
        set_preferences_recommender(recommender)
        set_recipes_recommender(recommender)
        set_images_recommender(recommender)
        print("✅ Recommender set in all API modules")
        
        print("✅ API is ready!")
        print(f"✅ RAG Status: {'Enabled' if recipe_vector_store else 'Disabled'}")
        print(f"✅ Image Generation: {'GPU-Enabled' if IMAGE_GENERATION_ENABLED else 'Text-Only'}")
    except Exception as e:
        print(f"❌ Startup error: {e}")
        import traceback
        traceback.print_exc()
        raise

# ============================================================
# Include API Routes
# ============================================================

app.include_router(preferences_router)
app.include_router(recipes_router)
app.include_router(sessions_router)
app.include_router(images_router)

# ============================================================
# Basic Routes
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