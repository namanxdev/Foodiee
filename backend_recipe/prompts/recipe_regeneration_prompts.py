"""
Recipe regeneration prompt templates
Used for generating beginner/advanced steps, validating ingredients, and generating images
"""

# Ingredients image generation prompt
INGREDIENTS_IMAGE_PROMPT = """Create a professional, appetizing image showing ALL the ingredients for this recipe arranged on a clean surface.

Recipe: {recipe_name}
Ingredients: {ingredients}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, labels, ingredient names, numbers, captions, watermarks, or any written elements
3. ALL INGREDIENTS VISIBLE: Ensure EVERY ingredient listed is visible and clearly arranged in the frame

The image should:
- Show ALL ingredients from the list, clearly arranged and visible
- Use natural lighting to show ingredients clearly
- Have a clean, professional food photography aesthetic
- Include measuring tools/bowls if they help display ingredients
- Use a neutral background (white, marble, or wood)
- Make ingredients look fresh, appetizing, and well-organized
- Frame composition should be HORIZONTAL (wider than tall)

STRICTLY FORBIDDEN: Any text, labels, numbers, ingredient names, captions, overlays, watermarks, or written elements of any kind.

Output: Horizontal landscape image (1024x680), professional food photography style, completely text-free."""

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
MAIN_IMAGE_PROMPT = """Create a professional, mouthwatering image of this finished dish.

Recipe: {recipe_name}
Description: {description}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, recipe names, labels, captions, watermarks, or any written elements
3. PROFESSIONAL PRESENTATION: Restaurant-quality plating and composition

The image should:
- Show the completed dish beautifully plated and presented
- Use professional food photography lighting
- Have an appetizing, restaurant-quality presentation
- Include garnishes and complementary elements
- Use appropriate serving dishes/plates for this cuisine
- Make the dish look delicious and inviting
- Frame composition should be HORIZONTAL (wider than tall)

STRICTLY FORBIDDEN: Any text, recipe names, labels, numbers, captions, overlays, watermarks, or written elements of any kind.

Output: Horizontal landscape image (1024x680), professional food photography style, vibrant colors, sharp focus, completely text-free."""

# Step-by-step image prompts
def get_step_image_prompt(recipe_name: str, step_number: int, step_text: str) -> str:
    """Generate prompt for a specific step image"""
    return f"""Create a clear, instructional image showing this cooking step in action.

Recipe: {recipe_name}
Step: {step_text}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, step numbers, labels, captions, watermarks, or any written elements
3. INSTRUCTIONAL CLARITY: Show the cooking action clearly and unambiguously

The image should:
- Clearly demonstrate the action described in the step
- Show hands/tools performing the action in a natural way
- Use good lighting to show details clearly
- Have an instructional, how-to photography style
- Be shot from an angle that shows the process clearly
- Include relevant ingredients/tools in frame
- Frame composition should be HORIZONTAL (wider than tall)

STRICTLY FORBIDDEN: Any text, step numbers, labels, ingredient names, measurements, captions, UI elements, overlays, watermarks, or written elements of any kind.

Output: Horizontal landscape image (1024x680), instructional photography style, clear and practical, completely text-free."""
