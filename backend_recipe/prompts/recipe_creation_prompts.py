"""
Recipe Creation Prompts
========================
Prompts for generating complete recipes from scratch
"""

# ============================================================================
# Recipe Name Generation
# ============================================================================

RECIPE_NAME_PROMPT = """You are a culinary expert. Given a dish name, format it as a proper, appealing recipe name.

Dish Name: {dish_name}
Region: {region}

Return ONLY the formatted recipe name, nothing else. Make it:
- Properly capitalized
- Clear and appealing
- Authentic to the region
- 2-6 words maximum

Examples:
- Input: "paneer tikka" → Output: "Paneer Tikka Masala"
- Input: "pasta carbonara" → Output: "Classic Carbonara Pasta"
- Input: "chicken biryani" → Output: "Hyderabadi Chicken Biryani"

Your formatted recipe name:"""


# ============================================================================
# Recipe Description Generation
# ============================================================================

RECIPE_DESCRIPTION_PROMPT = """You are a culinary expert. Write an appealing, informative description for this recipe.

Recipe Name: {recipe_name}
Region: {region}

Write a 2-3 sentence description that:
- Describes the dish's key flavors and characteristics
- Mentions what makes it special or unique
- Is appetizing and engaging
- Authentic to the cuisine

Return ONLY the description text, nothing else.

Your description:"""


# ============================================================================
# Ingredients List Generation
# ============================================================================

INGREDIENTS_LIST_PROMPT = """You are a culinary expert. Generate a complete, authentic ingredients list for this recipe.

Recipe Name: {recipe_name}
Region: {region}

Return a JSON array of ingredient objects. Each object must have:
- "ingredient": name of the ingredient
- "quantity": amount needed (with units)
- "notes": optional preparation notes (can be empty string)

Requirements:
- Include 8-15 ingredients
- Use authentic ingredients for the cuisine
- Specify realistic quantities
- Be specific (e.g., "red onions" not just "onions")
- Include spices, herbs, and garnishes
- Order logically (main ingredients first, then spices/seasonings)

Example format:
[
  {{"ingredient": "Paneer (cottage cheese)", "quantity": "250g", "notes": "cut into cubes"}},
  {{"ingredient": "Red bell peppers", "quantity": "2 medium", "notes": "cut into squares"}},
  {{"ingredient": "Yogurt", "quantity": "1/2 cup", "notes": "thick, full-fat"}},
  {{"ingredient": "Garam masala", "quantity": "1 tsp", "notes": ""}}
]

Your ingredients list (JSON only):"""


# ============================================================================
# Cooking Steps Generation
# ============================================================================

STEPS_PROMPT = """You are a culinary expert. Generate detailed cooking steps for this recipe.

Recipe Name: {recipe_name}
Ingredients:
{ingredients}

Level: {level}

Generate steps appropriate for a {level} cook:
- BEGINNER: Simple, detailed, explain techniques, smaller sub-steps
- ADVANCED: Concise, assume knowledge, combine related actions

Return a JSON array of step strings. Each step should:
- Be a clear, actionable instruction
- Start with a verb (e.g., "Heat", "Add", "Mix", "Cook")
- Include timing and temperature when relevant
- Be 1-3 sentences long
- Focus on one main action

Requirements:
- Include 8-15 steps total
- Cover all major stages: prep, cooking, finishing
- Be in logical chronological order
- Include important tips inline (e.g., "until golden brown")

Example format:
[
  "Heat 2 tablespoons of oil in a large pan over medium-high heat until shimmering.",
  "Add the cubed paneer and cook for 2-3 minutes per side until golden brown. Remove and set aside.",
  "In the same pan, add the bell peppers and onions. Sauté for 3-4 minutes until slightly charred.",
  "Reduce heat to medium. Add ginger-garlic paste and cook for 30 seconds until fragrant."
]

Your {level} steps (JSON only):"""


# ============================================================================
# Image Generation Prompts
# ============================================================================

INGREDIENTS_IMAGE_PROMPT = """Professional food photography showing all ingredients for {recipe_name}.

Ingredients to photograph: {ingredients}

⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY ⚠️

WHAT TO PHOTOGRAPH:
✅ Show EVERY ingredient listed above
✅ Display each ingredient in the VISUAL AMOUNT specified (e.g., if it says "2 cups flour", show a bowl with approximately 2 cups worth of flour visible)
✅ Arrange ingredients in clean bowls, small dishes, or neatly on the surface
✅ Make sure ALL ingredients from the list are visible in the photo

TEXT PROHIBITION - ABSOLUTELY NO TEXT:
❌ DO NOT write ingredient names as text (no "Flour", "Salt", "Sugar" text)
❌ DO NOT write quantities or measurements as text (no "2 cups", "500g", "3 tbsp" text)
❌ DO NOT label anything with text
❌ NO numbers, letters, words, or characters of ANY kind
❌ NO package labels, brand names, or product text visible
❌ NO watermarks, typography, or written symbols

IMPORTANT DISTINCTION:
- "2 cups flour" means → Show a bowl containing the visual amount of approximately 2 cups of flour (NO text "2 cups flour" written)
- "500g sugar" means → Show sugar in the visual amount of approximately 500g (NO text "500g sugar" written)
- "3 cloves garlic" means → Show 3 garlic cloves visually (NO text "3 cloves garlic" written)

Image requirements:
- Professional food photography with excellent lighting
- All ingredients clearly visible and beautifully arranged
- Clean flat-lay or overhead shot
- Neutral background (marble, wood, white)
- Horizontal landscape format (4:3 aspect ratio)

Create a purely visual photograph showing all the ingredients in their approximate quantities, with ZERO text anywhere in the image."""


MAIN_IMAGE_PROMPT = """Professional food photography of the finished dish: {recipe_name}.

Recipe name (FOR REFERENCE ONLY - DO NOT WRITE IN IMAGE): {recipe_name}
Description (FOR REFERENCE ONLY - DO NOT WRITE IN IMAGE): {description}

⚠️ CRITICAL - READ THIS FIRST ⚠️
The recipe name and description above tell you WHAT dish to photograph.
DO NOT write the recipe name, description, or any text in the image.
Show the finished dish VISUALLY only, with NO text of any kind.

ULTRA-STRICT TEXT PROHIBITION - ABSOLUTE RULE:
❌ ZERO text, letters, words, or numbers anywhere in the image
❌ DO NOT write the recipe name or dish name
❌ DO NOT write the description or any part of it
❌ NO recipe names, labels, or captions
❌ NO watermarks, typography, or symbols
❌ NO plate decorations with text
❌ NO numbers, measurements, or written elements of ANY kind
✅ ONLY photograph the finished dish visually

The recipe name and description are your GUIDE for what to photograph, NOT text to display.

Image requirements:
- Beautiful plating on attractive dish/bowl
- Perfectly cooked, appetizing appearance
- Professional food styling with garnishes
- Excellent lighting (warm, soft, directional)
- Restaurant-quality presentation
- Shallow depth of field if appropriate
- Horizontal landscape format

ABSOLUTE PROHIBITION: Any text, letters, words, numbers, recipe names, descriptions, labels, captions, or typography are 100% FORBIDDEN.

Create a purely visual photograph of the finished dish with ZERO text.

REMEMBER: Horizontal 1024x680 format, NO TEXT of any kind, focus on making the dish look irresistible."""

# Note: Step image prompts are now handled by core.step_image_prompt_generator
# This ensures unified, cumulative state-based prompt generation across all flows


# ============================================================================
# Recipe Metadata Generation
# ============================================================================

RECIPE_METADATA_PROMPT = """You are a culinary expert. Generate realistic metadata for this recipe.

Recipe Name: {recipe_name}
Region: {region}

Return a JSON object with these fields:
{{
  "prep_time_minutes": <realistic prep time in minutes>,
  "cook_time_minutes": <realistic cook time in minutes>,
  "calories": <estimated calories per serving, be realistic>,
  "rating": <estimated rating from 3.5 to 5.0>,
  "tastes": ["<primary taste>", "<secondary taste>"],
  "meal_types": ["<applicable meal type(s)>"],
  "dietary_tags": ["<applicable dietary tags>"]
}}

Guidelines:
- PREP TIME: Consider chopping, mixing, marinating time (typically 10-45 minutes)
- COOK TIME: Actual cooking/baking time (typically 15-90 minutes depending on dish)
- CALORIES: Per serving, be realistic (200-800 for most dishes)
- RATING: Estimated quality rating (3.5 to 5.0 scale):
  * 4.5-5.0: Exceptional, popular, well-loved dishes
  * 4.0-4.4: Very good, solid traditional recipes
  * 3.5-3.9: Good, less common or acquired taste
- TASTES: Choose 2-3 primary tastes from: "Sweet", "Spicy", "Savory", "Sour", "Tangy", "Mild", "Rich", "Bitter", "Umami"
- MEAL_TYPES: Choose 1-2 from: "Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Appetizer"
- DIETARY_TAGS: Choose applicable tags from: "Vegetarian", "Vegan", "Non-Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Low-Carb", "High-Protein", "Keto-Friendly", "Paleo"

Be realistic and authentic to the {region} cuisine.

Return ONLY valid JSON, no markdown code blocks, no explanation."""

