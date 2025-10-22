"""
Recipe prompt templates for the Recipe Recommender system
"""

from langchain_core.prompts import ChatPromptTemplate

class RecipePrompts:
    """
    Container class for all recipe-related prompt templates
    """
    
    @staticmethod
    def get_recipe_prompt_with_rag():
        """Recipe recommendation prompt with RAG context"""
        return ChatPromptTemplate.from_messages([
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
    
    @staticmethod
    def get_recipe_prompt():
        """Recipe recommendation prompt without RAG"""
        return ChatPromptTemplate.from_messages([
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
    
    @staticmethod
    def get_detail_prompt_with_rag():
        """Detailed recipe prompt with RAG context"""
        return ChatPromptTemplate.from_messages([
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
    
    @staticmethod
    def get_detail_prompt():
        """Detailed recipe prompt without RAG"""
        return ChatPromptTemplate.from_messages([
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
    
    @staticmethod
    def get_alternative_prompt():
        """Ingredient alternatives prompt"""
        return ChatPromptTemplate.from_messages([
            ("system", "You are an expert chef who suggests ingredient alternatives."),
            ("user", """Suggest 3 good alternatives for the ingredient: {missing_ingredient}

Recipe context: {recipe_context}

For each alternative, explain:
- What it is
- How to use it as a substitute
- How it will affect the taste

Keep suggestions practical and commonly available.""")
        ])
    
    @staticmethod
    def get_image_prompt():
        """Stable Diffusion image generation prompt"""
        return ChatPromptTemplate.from_messages([
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