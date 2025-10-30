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
    
    @staticmethod
    def get_ranking_prompt():
        """Database recipe ranking prompt for optimized recommender"""
        return ChatPromptTemplate.from_template("""
You are a chef helping personalize recipe recommendations.

User Preferences:
{preferences}

Here are {count} recipes from our database that match the user's cuisine and meal type:
{recipes}

AVAILABLE RECIPE NAMES (copy these EXACTLY):
{available_names}

Your task: Rank these recipes from most to least suitable for this user, considering:
1. Their taste preferences
2. Their available ingredients
3. Their skill level (infer from time available)
4. Their dietary restrictions

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY:
- You MUST use the EXACT recipe names listed under "AVAILABLE RECIPE NAMES" above
- Copy the names CHARACTER-BY-CHARACTER from that list
- DO NOT write "Recipe 1", "Recipe 2", "Recipe 3" - these are placeholder names
- DO NOT paraphrase or shorten the recipe names
- If the name is "Kadai Paneer", write "Kadai Paneer" - not "Recipe 2" or "Paneer Recipe"

Return ONLY the top 3 recipes in this exact format (use EXACT names from AVAILABLE RECIPE NAMES):

1. [EXACT Recipe Name] - [One sentence why it's perfect]
2. [EXACT Recipe Name] - [One sentence why it's perfect]
3. [EXACT Recipe Name] - [One sentence why it's perfect]

Remember: Copy names EXACTLY from the AVAILABLE RECIPE NAMES list above!
""")
    
    @staticmethod
    def get_step_breakdown_prompt():
        """Prompt to break down complex recipe instructions into clear steps"""
        return ChatPromptTemplate.from_template("""
You are an expert chef providing step-by-step cooking instructions.

Recipe: {recipe_name}

Current Instructions:
{instructions}

Your task: Break this down into clear, numbered cooking steps.

Requirements:
1. Each step should be ONE clear action
2. Format: "STEP 1: [action]", "STEP 2: [action]", etc.
3. Keep steps short (1-2 sentences maximum)
4. Make it easy to follow while cooking
5. Include all important details (temperature, timing, technique)
6. Order: Prep → Cook → Finish

Example format:
STEP 1: Heat oil in a large pan over medium heat
STEP 2: Add chopped onions and sauté until golden brown (about 5 minutes)
STEP 3: Add spices and cook for 1 minute until fragrant

Now provide the steps for the recipe above:
""")