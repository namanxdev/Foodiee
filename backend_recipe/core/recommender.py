"""
Recipe Recommender Core Class
"""

import base64
import gc
import platform
from io import BytesIO
from typing import Optional, Tuple

import torch
from langchain_core.output_parsers import StrOutputParser

from config import (
    llm, 
    vision_llm, 
    recipe_vector_store, 
    IMAGE_GENERATION_ENABLED, 
    stable_diffusion_pipe
)
from prompts import RecipePrompts

class RecipeRecommender:
    def __init__(self):
        # Don't set these at init time - get them dynamically
        # self.llm = llm  # This would be None at init time
        # self.vision_llm = vision_llm  # This would be None at init time
        # self.vector_store = recipe_vector_store  # This might be None at init time
        
        # Initialize prompts
        self.recipe_prompt_with_rag = RecipePrompts.get_recipe_prompt_with_rag()
        self.recipe_prompt = RecipePrompts.get_recipe_prompt()
        self.detail_prompt_with_rag = RecipePrompts.get_detail_prompt_with_rag()
        self.detail_prompt = RecipePrompts.get_detail_prompt()
        self.alternative_prompt = RecipePrompts.get_alternative_prompt()
        self.sd_image_prompt = RecipePrompts.get_image_prompt()
    
    @property
    def llm(self):
        """Get current LLM instance"""
        from config import get_llm
        return get_llm()
    
    @property
    def vision_llm(self):
        """Get current vision LLM instance"""
        from config import get_vision_llm
        return get_vision_llm()
    
    @property
    def vector_store(self):
        """Get current vector store instance"""
        from config import get_recipe_vector_store
        return get_recipe_vector_store()
    
    def recommend_recipes(self, preferences_str: str):
        """Get recipe recommendations"""
        print(f"🔍 Debug: vector_store is None: {self.vector_store is None}")
        print(f"🔍 Debug: llm is None: {self.llm is None}")
        
        if self.vector_store:
            print("🔍 Debug: Using RAG chain")
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
            result = rag_chain.invoke(search_query)
        else:
            print("🔍 Debug: Using simple chain (no RAG)")
            if self.llm is None:
                raise ValueError("LLM is not initialized. Check your configuration.")
            
            chain = self.recipe_prompt | self.llm | StrOutputParser()
            result = chain.invoke({"preferences": preferences_str})
        
        # For compatibility with OptimizedRecipeRecommender, return dict format
        # (Traditional recommender doesn't have recipe mapping since it generates on the fly)
        return {
            "response": result,
            "recipe_mapping": {}  # Empty for traditional recommender
        }
    
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
    
    def generate_image(self, recipe_name: str, step_description: str) -> Tuple[Optional[object], str]:
        """Generate image using Stable Diffusion"""
        from config import get_image_generation_enabled, get_stable_diffusion_pipe
        
        # Generate prompt
        image_prompt = self.generate_image_prompt(recipe_name, step_description)
        
        IMAGE_GENERATION_ENABLED = get_image_generation_enabled()
        stable_diffusion_pipe = get_stable_diffusion_pipe()
        
        if not IMAGE_GENERATION_ENABLED or stable_diffusion_pipe is None:
            print("⚠️  Image generation not enabled or Stable Diffusion not initialized.")
            return None, image_prompt
        
        try:
            with torch.inference_mode():
                with torch.autocast(device_type="cpu"):  # Auto-cast for better performance
                    image = stable_diffusion_pipe(
                        image_prompt,
                        num_inference_steps=30,
                        guidance_scale=7.5,
                        height=512,
                        width=512
                    ).images[0]
            
            # Clear memory based on device
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            if platform.system() == "Darwin" and torch.backends.mps.is_available():
                torch.mps.empty_cache()
            
            gc.collect()
            
            return image, image_prompt
        except Exception as e:
            print(f"Error generating image: {e}")
            import traceback
            traceback.print_exc()
            return None, image_prompt
    
    def get_ingredient_alternatives(self, missing_ingredient: str, recipe_context: str):
        """Get ingredient alternatives"""
        chain = self.alternative_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "missing_ingredient": missing_ingredient,
            "recipe_context": recipe_context
        })