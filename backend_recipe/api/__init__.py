"""
API routes package for Recipe Recommender API
"""

from .preferences import router as preferences_router
from .recipes import router as recipes_router  
from .sessions import router as sessions_router
from .images import router as images_router

__all__ = [
    "preferences_router",
    "recipes_router", 
    "sessions_router",
    "images_router"
]