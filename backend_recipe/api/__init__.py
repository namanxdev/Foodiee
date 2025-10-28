"""
API routes package for Recipe Recommender API
"""

from .preferences import router as preferences_router
from .recipes import router as recipes_router  
from .sessions import router as sessions_router
from .images import router as images_router
from .users import router as users_router
from .top_recipes import router as top_recipes_router

__all__ = [
    "preferences_router",
    "recipes_router", 
    "sessions_router",
    "images_router",
    "users_router",
    "top_recipes_router"
]