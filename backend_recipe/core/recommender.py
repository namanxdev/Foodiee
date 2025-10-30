"""
RAG-based Recipe Recommender
Uses vector store and LLM for recipe generation
"""

from langchain_core.output_parsers import StrOutputParser

from prompts import RecipePrompts
from core.base_recommender import BaseRecommender


class RecipeRecommender(BaseRecommender):
    """
    Traditional RAG-based recommender
    - Uses vector store for recipe retrieval (if available)
    - Generates recipes dynamically with LLM
    - Suitable for PDF-based recipe collections
    """
    
    def __init__(self):
        """Initialize RAG-based recommender"""
        super().__init__()
        
        # RAG-specific prompts
        self.recipe_prompt_with_rag = RecipePrompts.get_recipe_prompt_with_rag()
        self.recipe_prompt = RecipePrompts.get_recipe_prompt()
        self.detail_prompt_with_rag = RecipePrompts.get_detail_prompt_with_rag()
        self.detail_prompt = RecipePrompts.get_detail_prompt()
    
    # ========================================================
    # Properties (implement from BaseRecommender)
    # ========================================================
    
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
    
    # ========================================================
    # Recipe Recommendation (RAG-specific implementation)
    # ========================================================
    
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
    
    # Image generation methods inherited from BaseRecommender:
    # - generate_image_with_gemini()
    # - generate_image_with_stable_diffusion()
    # - generate_image_prompt()
    # - get_ingredient_alternatives()
