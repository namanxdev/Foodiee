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

INGREDIENTS_IMAGE_PROMPT = """Generate a professional food photography image showing all ingredients for {recipe_name}.

Ingredients to include: {ingredients}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, labels, numbers, captions, watermarks, or any written elements on the image
3. ALL INGREDIENTS VISIBLE: Ensure EVERY ingredient listed is visible and clearly arranged in the frame
4. PROFESSIONAL PRESENTATION:
   - Clean, organized flat-lay or overhead shot
   - All ingredients in small bowls or arranged neatly
   - Good lighting (natural or studio)
   - Sharp focus, high detail
   - Appealing color composition
   - Marble, wood, or neutral background

STYLE: Professional cookbook photography, clean and elegant, ingredients clearly visible

REMEMBER: Horizontal 1024x680 format, NO TEXT of any kind, ALL ingredients must be visible in frame."""


MAIN_IMAGE_PROMPT = """Generate a professional food photography image of the finished dish: {recipe_name}.

Description: {description}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, labels, numbers, captions, watermarks, or any written elements on the image
3. PROFESSIONAL PRESENTATION:
   - Beautiful plating on an attractive dish/bowl
   - Perfectly cooked, appetizing appearance
   - Professional food styling (garnishes, props)
   - Excellent lighting (warm, soft, directional)
   - Shallow depth of field (blurred background)
   - Restaurant-quality presentation
   - Context elements (utensils, napkin, ingredients) in background

STYLE: High-end restaurant food photography, magazine-quality, highly detailed, mouth-watering

REMEMBER: Horizontal 1024x680 format, NO TEXT of any kind, focus on making the dish look irresistible."""


def get_step_image_prompt(recipe_name: str, step_description: str) -> str:
    """Generate prompt for a specific cooking step image"""
    return f"""Generate a professional cooking process image for: {recipe_name}

Step: {step_description}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, labels, numbers, captions, watermarks, or any written elements on the image
3. SHOW THE ACTION:
   - Capture the specific cooking action described in the step
   - Show hands/utensils performing the action (when relevant)
   - Kitchen environment visible but not distracting
   - Clear view of the food/ingredients being prepared
   - Mid-action shot (not before/after, but during)

4. PROFESSIONAL QUALITY:
   - Excellent lighting (warm kitchen lighting)
   - Sharp focus on main subject
   - Clean, organized cooking space
   - Realistic cooking scenario
   - Professional food photography style
   - Appropriate angle (overhead, side, or 45-degree)

STYLE: Cooking tutorial photography, clear instruction, professional kitchen, realistic and achievable

REMEMBER: Horizontal 1024x680 format, NO TEXT of any kind, show the cooking process clearly."""


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

