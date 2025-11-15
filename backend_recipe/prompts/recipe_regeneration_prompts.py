"""
Recipe regeneration prompt templates
Used for generating beginner/advanced steps, validating ingredients, and generating images
"""

# Ingredients image generation prompt
INGREDIENTS_IMAGE_PROMPT = """Professional food photography showing ALL ingredients for this recipe arranged beautifully on a clean surface.

Recipe: {recipe_name}
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
- Clean background (white, marble, or wood)
- Fresh, appetizing presentation
- Horizontal landscape format (4:3 aspect ratio)

Create a purely visual photograph showing all the ingredients in their approximate quantities, with ZERO text anywhere in the image."""

# Beginner steps generation prompt
BEGINNER_STEPS_PROMPT = """You are creating a recipe guide for BEGINNERS who are learning to cook. Generate 5-15 detailed steps for this recipe.

Recipe Name: {recipe_name}
Description: {description}
Ingredients: {ingredients}
Original Steps (for reference): {original_steps}

CRITICAL REQUIREMENTS FOR BEGINNER STEPS:
1. Break down complex actions into simple, clear steps
2. Explain WHY each step is important
3. Include temperature settings, timing, and visual cues
4. Warn about common mistakes
5. Describe what the food should look like at each stage
6. Use simple cooking terminology and explain technical terms
7. Each step should be 2-4 sentences with clear details
8. Include prep steps (washing, peeling, chopping) explicitly
9. Number of steps: minimum 5, maximum 15

Return ONLY a JSON array of step strings. Example format:
["STEP 1: Wash all vegetables under running water. Pat them dry with a clean kitchen towel. This removes dirt and excess moisture which can affect cooking time.", "STEP 2: Place a large non-stick pan on medium heat (setting 4-5 out of 10). Wait for 2 minutes until the pan is warm. You can test by sprinkling a few drops of water - they should sizzle gently.", ...]

IMPORTANT: Return ONLY the JSON array, no additional text or explanations."""

# Advanced steps generation prompt
ADVANCED_STEPS_PROMPT = """You are creating a recipe guide for EXPERIENCED COOKS who understand cooking fundamentals. Generate 5-15 optimized steps for this recipe.

Recipe Name: {recipe_name}
Description: {description}
Ingredients: {ingredients}
Original Steps (for reference): {original_steps}

CRITICAL REQUIREMENTS FOR ADVANCED STEPS:
1. Combine related actions into efficient steps
2. Use professional cooking terminology
3. Focus on technique and precision
4. Assume knowledge of basic prep (mise en place)
5. Include chef's tips and variations
6. Mention texture, aroma, and flavor development
7. Each step should be 1-2 sentences, concise but complete
8. Skip obvious prep unless critical to the recipe
9. Number of steps: minimum 5, maximum 15

Return ONLY a JSON array of step strings. Example format:
["STEP 1: Mise en place: Dice onions, mince garlic, and cube proteins. Season and marinate if needed.", "STEP 2: Heat pan to medium-high until shimmering. Sear proteins until Maillard reaction develops, working in batches to avoid crowding.", ...]

IMPORTANT: Return ONLY the JSON array, no additional text or explanations."""

# Ingredient validation prompt
INGREDIENT_VALIDATION_PROMPT = """You are a culinary expert validating recipe ingredients for accuracy and completeness.

Recipe Name: {recipe_name}
Cuisine: {cuisine}
Current Ingredients: {ingredients}

Validate and improve the ingredient list. Check for:
1. Missing essential ingredients for this dish
2. Incorrect quantities or measurements
3. Uncommon or hard-to-find ingredients (suggest substitutes)
4. Proper ingredient names and spellings
5. Logical grouping (proteins, vegetables, spices, etc.)

Return a JSON object with this structure:
{{
    "is_valid": true/false,
    "issues": ["list of issues found"],
    "corrected_ingredients": "corrected ingredient list as a string",
    "suggestions": ["optional ingredient suggestions or substitutes"]
}}

Be thorough but practical. Only mark as invalid if there are serious problems."""

# Mass recipe generation prompt
MASS_GENERATION_PROMPT = """Generate {count} unique and authentic {cuisine} recipes.

Requirements:
1. Each recipe must be a real, traditional dish from {cuisine} cuisine
2. Include recipe name, brief description, and ingredients
3. Ensure variety - different cooking methods, meal types, and ingredients
4. No duplicates of these existing recipes: {existing_recipes}

Return ONLY a JSON array with this structure:
[
    {{
        "name": "Recipe Name",
        "description": "Brief 2-3 sentence description",
        "ingredients": "Complete ingredient list with quantities",
        "cuisine": "{cuisine}"
    }}
]

IMPORTANT: 
- Return ONLY the JSON array, no additional text
- Ensure all recipes are authentic to the cuisine
- Make descriptions appealing and informative"""

# Main recipe image prompt (existing, for reference)
MAIN_IMAGE_PROMPT = """Professional food photography of the finished dish with restaurant-quality presentation.

Recipe (FOR REFERENCE ONLY - DO NOT WRITE IN IMAGE): {recipe_name}
Description (FOR REFERENCE ONLY - DO NOT WRITE IN IMAGE): {description}

⚠️ CRITICAL - READ THIS FIRST ⚠️
The recipe name and description above tell you WHAT dish to photograph.
DO NOT write the recipe name, description, or any text in the image.
Show the finished dish VISUALLY only, with NO text of any kind.

ULTRA-STRICT TEXT PROHIBITION - ABSOLUTE RULE:
❌ ZERO text, letters, words, or numbers anywhere in the image
❌ DO NOT write the recipe name or dish name
❌ DO NOT write the description or any part of it
❌ NO labels, captions, or watermarks
❌ NO typography, symbols, or written language
❌ NO plate decorations with text or letters
❌ NO numbers, measurements, or quantity indicators
✅ ONLY photograph the finished dish visually

The recipe name and description are your GUIDE for what to photograph, NOT text to display.

Image requirements:
- Beautiful plating and professional presentation
- Restaurant-quality styling with garnishes
- Professional food photography lighting
- Appetizing, delicious appearance
- Appropriate serving dishes for this cuisine
- Horizontal landscape format
- Vibrant colors, sharp focus

ABSOLUTE PROHIBITION: Any text, letters, words, recipe names, descriptions, labels, captions, numbers, or typography are 100% FORBIDDEN.

Create a purely visual photograph of the finished dish with ZERO text."""

# Note: Step image prompts are now handled by core.step_image_prompt_generator
# This ensures unified, cumulative state-based prompt generation across all flows
