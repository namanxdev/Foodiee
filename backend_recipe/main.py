"""
FastAPI Backend for Recipe Recommendation System with RAG + Image Generation
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
import config  # Import module to access variables dynamically

# Import modularized components
from config import (
    initialize_all, 
    recipe_vector_store
)
from core import RecipeRecommender
from api import (
    preferences_router,
    recipes_router, 
    sessions_router,
    images_router,
    users_router,
    top_recipes_router
)
from api.recipe_admin import router as recipe_admin_router
from api.image_generation_limits import router as image_generation_limits_router
from api.preferences import set_recommender as set_preferences_recommender
from api.recipes import set_recommender as set_recipes_recommender
from api.images import set_recommender as set_images_recommender


# ============================================================
# CORS Configuration - MUST be defined before app creation
# ============================================================
# NOTE: When allow_credentials=True, you cannot use "*" as a wildcard origin.
# Add your deployed frontend URL here after deployment.
ALLOWED_ORIGINS = [
    "http://localhost:3000",     
    "http://127.0.0.1:3000",
    "https://foodiee-six-lac.vercel.app",      
   
]

# Global recommender instance
recommender = None

# ============================================================
# Lifespan Context Manager
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all components on startup and cleanup on shutdown"""
    global recommender
    
    print("🚀 Starting Recipe Recommender API...")
    
    try:
        # Initialize all components
        print("🔧 Initializing components...")
        initialize_all()
        
        # Create recommender instance (optimized if database available)
        print("\n🤖 Creating RecipeRecommender instance...")
        
        if config.recipe_db:
            # Use optimized recommender with database (3-5x faster!)
            from core.optimized_recommender import OptimizedRecipeRecommender
            recommender = OptimizedRecipeRecommender(config.recipe_db)
            print("✅ Using OPTIMIZED RecipeRecommender (database-first)")
            print("   💡 Supports 100+ concurrent users with 3-5x faster responses!")
        else:
            # Fallback to traditional recommender
            recommender = RecipeRecommender()
            print("✅ Using traditional RecipeRecommender (PDF/LLM-based)")
            print("   💡 To scale, run: python scripts/populate_recipes.py")
        
        # Set recommender in all API modules
        print("🔗 Setting recommender in API modules...")
        set_preferences_recommender(recommender)
        set_recipes_recommender(recommender)
        set_images_recommender(recommender)
        print("✅ Recommender set in all API modules")
        
        print("\n✅ API is ready!")
        print(f"✅ Database RAG: {'Enabled (727 recipes with embeddings)' if config.recipe_db else 'Disabled'}")
        print(f"✅ PDF RAG: {'Enabled' if recipe_vector_store else 'Disabled (not needed with Database RAG)'}")
        print(f"✅ Recipe DB: {'Enabled' if config.recipe_db else 'Disabled'}")
        # print(f"✅ Image Generation: {'GPU-Enabled' if IMAGE_GENERATION_ENABLED else 'Text-Only'}")
    except Exception as e:
        print(f"❌ Startup error: {e}")
        import traceback
        traceback.print_exc()
        raise
    
    yield
    
    # Clean up resources on shutdown
    print("🛑 Shutting down Recipe Recommender API...")

# ============================================================
# FastAPI App Setup
# ============================================================
app = FastAPI(
    title="Recipe Recommender API",
    description="AI-powered recipe recommendation with RAG and image generation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware - using ALLOWED_ORIGINS defined above
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ============================================================
# Include API Routes
# ============================================================

app.include_router(preferences_router)
app.include_router(recipes_router)
app.include_router(sessions_router)
app.include_router(images_router)
app.include_router(users_router)
app.include_router(top_recipes_router)
app.include_router(recipe_admin_router)
app.include_router(image_generation_limits_router)

# ============================================================
# Basic Routes
# ============================================================

@app.get("/")
async def root():
    """API health check"""
    
    recipe_count = 0
    if config.recipe_db:
        try:
            stats = config.recipe_db.get_stats()
            recipe_count = stats.get('total_recipes', 0)
        except:
            recipe_count = 0
    
    return {
        "message": "Recipe Recommender API is running!",
        "version": "2.0.0",
        "database_rag_enabled": config.recipe_db is not None,
        "pdf_rag_enabled": recipe_vector_store is not None,
        "recipe_count": recipe_count,
        # "image_generation": "gpu" if IMAGE_GENERATION_ENABLED else "text_only",
        "mode": "optimized" if config.recipe_db else "traditional",
        "supports_concurrent_users": 100 if config.recipe_db else 10
    }

# ============================================================
# Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    import sys
    import io
    
    # Fix Windows console encoding for emojis
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("="*60)
    print("Recipe Recommender API with RAG + Image Generation")
    print("="*60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Allow external connections (required for EC2/cloud deployments)
        port=8000,
        reload=False  # Set to True for development
    )