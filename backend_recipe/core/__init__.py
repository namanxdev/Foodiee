"""
Core package for Recipe Recommender API

Module Structure:
- BaseRecommender: Shared functionality (image generation, alternatives)
- RecipeRecommender: RAG-based recommender (PDF/vector store)
- OptimizedRecipeRecommender: Database-first recommender (structured queries)
- ImageGenerator: Unified image generation (Gemini + Stable Diffusion)
"""

from .base_recommender import BaseRecommender
from .recommender import RecipeRecommender
from .optimized_recommender import OptimizedRecipeRecommender
from .image_generator import ImageGenerator

__all__ = [
    "BaseRecommender",
    "RecipeRecommender",
    "OptimizedRecipeRecommender",
    "ImageGenerator"
]