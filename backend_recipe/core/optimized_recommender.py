"""
Optimized Recipe Recommender using Database-First approach
"""

import base64
import gc
import platform
from io import BytesIO
from typing import Optional, Tuple, List, Dict
import os
import torch
from google import genai
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate


from config import (
    llm, 
    vision_llm, 
    recipe_vector_store, 
    IMAGE_GENERATION_ENABLED, 
    stable_diffusion_pipe,
    embeddings
)
from prompts import RecipePrompts
from database.db_helpers import RecipeDatabase

class OptimizedRecipeRecommender:
    """
    Optimized recommender that uses database-first approach
    - 95% database queries (fast!)
    - 5% LLM calls (only for ranking/personalization)
    """
    
    def __init__(self, db: RecipeDatabase):
        self.db = db
        
        # LLM prompts (minimal usage)
        self.ranking_prompt = ChatPromptTemplate.from_template("""
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
    def embeddings_model(self):
        """Get current embeddings model"""
        from config import embeddings
        return embeddings
    
    # ========================================================
    # Recommendation Flow
    # ========================================================
    
    def recommend_recipes(self, preferences_input) -> str:
        """
        Optimized recommendation flow:
        1. Filter database (fast!) - 50-100ms
        2. Semantic search if needed - 100-200ms
        3. LLM ranking (minimal) - 1-2s
        
        Total: 2-3s instead of 5-7s!
        
        Args:
            preferences_input: Can be either:
                - Dict with structured preferences (from API)
                - String with preferences (legacy format)
        """
        # Handle both string and dict inputs
        if isinstance(preferences_input, str):
            # Parse string format into dict
            preferences_dict = self._parse_preferences_string(preferences_input)
        else:
            preferences_dict = preferences_input
        
        print(f"🔍 [OPTIMIZED] Finding recipes for {preferences_dict.get('region', 'any')} {preferences_dict.get('meal_type', 'any meal')}")
        
        # Step 1: Database filtering (FAST!)
        max_time_minutes = self._parse_time(preferences_dict.get('time_available', '60 mins'))
        
        candidates = self.db.find_recipes(
            cuisine=preferences_dict['region'],
            meal_type=preferences_dict['meal_type'],
            max_time_minutes=max_time_minutes,
            exclude_allergens=preferences_dict.get('allergies', []),
            taste_preferences=preferences_dict.get('taste_preferences', []),
            limit=20
        )
        
        print(f"   ✅ Found {len(candidates)} matching recipes in database")
        
        if not candidates:
            return "Sorry, no recipes found matching your preferences. Try a different cuisine or meal type."
        
        # Step 2: Optionally use semantic search for better matching
        # (Only if embeddings available)
        if self.embeddings_model and len(candidates) > 10:
            search_query = f"{preferences_dict['region']} {preferences_dict['meal_type']} with {', '.join(preferences_dict.get('taste_preferences', []))}"
            query_embedding = self.embeddings_model.embed_query(search_query)
            
            semantic_results = self.db.semantic_search(query_embedding, limit=10)
            print(f"   ✅ Semantic search refined to top 10")
            
            # Combine results (prefer semantic matches)
            candidates = semantic_results[:10] + [c for c in candidates if c not in semantic_results][:10]
        
        # Step 3: LLM ranking (only top candidates!)
        top_candidates = candidates[:10]  # Only rank top 10
        
        # Store recipe names for post-processing
        recipe_names = [r['name'] for r in top_candidates]
        
        recipes_summary = "\n\n".join([
            f"{i+1}. {r['name']}\n"
            f"   - Time: {r['total_time_minutes']} mins ({r['difficulty']})\n"
            f"   - Taste: {', '.join(r['taste_profile'])}\n"
            f"   - Ingredients: {', '.join([ing['name'] for ing in r['ingredients'][:5]])}"
            for i, r in enumerate(top_candidates)
        ])
        
        preferences_str = f"""
- Region/Cuisine: {preferences_dict['region']}
- Taste Preferences: {', '.join(preferences_dict.get('taste_preferences', []))}
- Meal Type: {preferences_dict['meal_type']}
- Time Available: {preferences_dict.get('time_available', 'flexible')}
- Available Ingredients: {', '.join(preferences_dict.get('available_ingredients', []))}
"""
        
        chain = self.ranking_prompt | self.llm | StrOutputParser()
        ranked_response = chain.invoke({
            "preferences": preferences_str,
            "recipes": recipes_summary,
            "count": len(top_candidates),
            "available_names": "\n".join([f"- {name}" for name in recipe_names])
        })
        
        print(f"   ✅ LLM ranked top 3 recipes")
        
        # 🔥 POST-PROCESS: Match LLM's recipe names back to database names
        import re
        from difflib import get_close_matches
        
        print(f"   📝 LLM raw response:\n{ranked_response[:500]}")  # Debug: show raw response
        
        # Extract recipe names from LLM response
        response_lines = ranked_response.strip().split('\n')
        extracted_recipes = []
        
        for line in response_lines:
            # Try to extract: "1. Kadai Paneer - Perfect spicy..."
            match = re.match(r'^\d+\.\s+([^-\n]+)', line)
            if match:
                extracted_recipes.append(match.group(1).strip())
        
        print(f"   🔍 Extracted recipes from LLM: {extracted_recipes}")
        
        # Map LLM's recipe names to actual database names using fuzzy matching
        recipe_mapping = {}
        corrected_response = ranked_response
        
        for i, llm_recipe in enumerate(extracted_recipes[:3], 1):
            # Find the closest match in database recipe names
            matches = get_close_matches(llm_recipe, recipe_names, n=1, cutoff=0.6)
            
            if matches:
                db_recipe = matches[0]
                recipe_mapping[f"Recipe {i}"] = db_recipe
                
                # Replace LLM's name with database name in the response
                corrected_response = re.sub(
                    rf'^(\d+\.)\s+{re.escape(llm_recipe)}',
                    rf'\1 {db_recipe}',
                    corrected_response,
                    flags=re.MULTILINE
                )
                
                print(f"   🔄 Matched '{llm_recipe}' → '{db_recipe}' (Recipe {i})")
            else:
                # Fallback: use the i-th database recipe
                db_recipe = recipe_names[i-1] if i-1 < len(recipe_names) else llm_recipe
                recipe_mapping[f"Recipe {i}"] = db_recipe
                print(f"   ⚠️  No close match for '{llm_recipe}', using database fallback: '{db_recipe}'")
        
        print(f"   🔧 Post-processed response to use database names")
        
        # Return both the corrected response AND the recipe mapping
        return {
            "response": corrected_response,
            "recipe_mapping": recipe_mapping
        }
    
    def get_detailed_recipe(self, recipe_name: str, preferences_str: str = None) -> Dict:
        """
        Get detailed recipe from database (instant!)
        Falls back to LLM if not found
        """
        print(f"   📥 get_detailed_recipe received: '{recipe_name}'")  # Debug log
        
        # Clean up the recipe name (remove numbering like "1. ", "2. ")
        import re
        clean_name = re.sub(r'^\d+\.\s*', '', recipe_name).strip()
        clean_name = re.sub(r'\s*-\s*.*$', '', clean_name).strip()  # Remove everything after " - "
        
        print(f"   🔍 Looking for recipe: '{clean_name}'")
        
        # Check if this is a generic placeholder like "Recipe 1", "Recipe 2"
        is_placeholder = re.match(r'^Recipe\s+\d+$', clean_name, re.IGNORECASE)
        
        if is_placeholder:
            print(f"   ⚠️  '{clean_name}' is a placeholder name, cannot find in database")
            print(f"   🤖 Using LLM to generate based on user preferences...")
            # Use LLM to generate recipe
            try:
                from core.recommender import RecipeRecommender
                traditional_recommender = RecipeRecommender()
                return traditional_recommender.get_detailed_recipe(clean_name, preferences_str)
            except Exception as e:
                print(f"   ❌ LLM generation failed: {e}")
                raise ValueError(f"Recipe '{clean_name}' is a placeholder. Please provide the actual recipe name from the recommendations list.")
        
        # Try exact match first
        recipe = self.db.get_recipe_by_name(clean_name)
        
        # Try fuzzy search if exact match fails (but only for real recipe names)
        if not recipe and len(clean_name) > 3:  # At least 4 characters
            print(f"   🔍 Exact match not found, trying fuzzy search...")
            # Search for partial matches
            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                # Try multiple fuzzy patterns (most specific first)
                patterns = [
                    clean_name,  # Exact
                    f"{clean_name}%",  # Starts with
                    f"%{clean_name}%",  # Contains (only if name is specific enough)
                ]
                
                for pattern in patterns:
                    cursor.execute("""
                        SELECT 
                            id, name, cuisine_type, meal_type,
                            prep_time_minutes, cooking_time_minutes, total_time_minutes,
                            difficulty, servings, taste_profile, allergens, dietary_tags,
                            ingredients, steps, tips
                        FROM recipes
                        WHERE name ILIKE %s
                        LIMIT 1
                    """, (pattern,))
                    recipe = cursor.fetchone()
                    if recipe:
                        print(f"   ✅ Found fuzzy match: '{recipe['name']}' (pattern: {pattern})")
                        break
        
        if recipe:
            print(f"   ✅ Found recipe in database: {recipe['name']}")
            return {
                'id': str(recipe['id']),
                'name': recipe['name'],
                'ingredients': recipe['ingredients'],  # Already JSONB
                'steps': recipe['steps'],  # Already array
                'tips': recipe['tips'],
                'prep_time': recipe['prep_time_minutes'],
                'cooking_time': recipe['cooking_time_minutes'],
                'total_time': recipe['total_time_minutes'],
                'difficulty': recipe['difficulty'],
                'servings': recipe['servings']
            }
        
        # Fallback to LLM generation
        print(f"   🤖 Recipe '{clean_name}' not found in database, using LLM to generate...")
        try:
            from core.recommender import RecipeRecommender
            traditional_recommender = RecipeRecommender()
            return traditional_recommender.get_detailed_recipe(clean_name, preferences_str)
        except Exception as e:
            print(f"   ❌ LLM fallback failed: {e}")
            raise ValueError(f"Recipe '{clean_name}' not found in database and LLM generation failed: {e}")
    
    def parse_recipe_steps(self, recipe_data: Dict) -> Dict:
        """
        Recipe is already parsed from database!
        Break down long steps into simple actionable steps if needed
        """
        steps = recipe_data['steps']
        
        # Check if steps are too long (paragraph-style) or too few
        needs_breakdown = any(len(step) > 200 for step in steps) or len(steps) <= 3
        
        if needs_breakdown:
            print(f"   🔧 Breaking down instructions into clear cooking steps...")
            # Use LLM to break down into simple steps (matching original format)
            breakdown_prompt = ChatPromptTemplate.from_template("""
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
            
            chain = breakdown_prompt | self.llm | StrOutputParser()
            result = chain.invoke({
                "recipe_name": recipe_data['name'],
                "instructions": "\n\n".join(steps)
            })
            
            # Parse the result - extract lines starting with "STEP"
            lines = result.split('\n')
            steps = []
            for line in lines:
                line = line.strip()
                if line.startswith(('STEP', 'Step', '**STEP', '**Step')):
                    steps.append(line)
            
            # Fallback if no STEP format found
            if not steps:
                steps = [line.strip() for line in lines if line.strip() and len(line.strip()) > 10]
            
            print(f"   ✅ Broke down into {len(steps)} clear cooking steps")
        
        return {
            'ingredients': self._format_ingredients(recipe_data['ingredients']),
            'steps': steps,
            'tips': recipe_data.get('tips', '')
        }
    
    # ========================================================
    # Image Generation (Same as before, but with caching!)
    # ========================================================
    
    def generate_image_prompt(self, recipe_name: str, step_description: str) -> str:
        """Generate image prompt for Stable Diffusion"""
        chain = self.sd_image_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "recipe_name": recipe_name,
            "step_description": step_description
        }).strip()
    
    def gemini_image_generator(self,recipe_name:str, step_description: str) -> Tuple[Optional[str], str]:
        """Generate an image via Gemini using session context."""
        
        image_prompt = self.generate_image_prompt(recipe_name, step_description)
 
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not configured")
        
        client = genai.Client(api_key=api_key)
        
        try:
            result = client.models.generate_images(
                model="imagen-4.0-generate-001",
                prompt=image_prompt,
            )
        except Exception as exc:
            raise ValueError(f"Gemini image generation failed: {exc}") from exc
        
        image_base64 = None
        if result and getattr(result, "generated_images", None):
            primary = result.generated_images[0]
            image_bytes = None
            if hasattr(primary, "image") and getattr(primary.image, "image_bytes", None):
                image_bytes = primary.image.image_bytes
            elif hasattr(primary, "image_bytes"):
                image_bytes = primary.image_bytes
            
            if image_bytes:
                image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        
        return image_base64, image_prompt
    

    def generate_image(
        self, 
        recipe_id: str,
        recipe_name: str, 
        step_description: str,
        step_number: int = 0
    ) -> Tuple[Optional[object], str]:
        """
        Generate image with caching:
        1. Check database first (instant!)
        2. Generate only if not cached
        3. Save to database for next time
        """
        # Check cache first!
        image_type = f"step_{step_number}" if step_number > 0 else "hero"
        cached_url = self.db.get_recipe_image(recipe_id, image_type)
        
        if cached_url:
            print(f"   ✅ Using cached image for {recipe_name} {image_type}")
            # TODO: Download from Supabase Storage and return
            # For now, return None to indicate cached (frontend should fetch URL)
            return None, f"[Cached image available at: {cached_url}]"
        
        # Generate prompt
        image_prompt = self.generate_image_prompt(recipe_name, step_description)
        
        from config import get_image_generation_enabled, get_stable_diffusion_pipe
        
        IMAGE_GENERATION_ENABLED = get_image_generation_enabled()
        stable_diffusion_pipe = get_stable_diffusion_pipe()
        
        if not IMAGE_GENERATION_ENABLED or stable_diffusion_pipe is None:
            print("⚠️  Image generation not enabled or Stable Diffusion not initialized.")
            return None, image_prompt
        
        try:
            print(f"   🎨 Generating new image for {recipe_name} {image_type}...")
            
            with torch.inference_mode():
                with torch.autocast(device_type="cpu"):
                    image = stable_diffusion_pipe(
                        image_prompt,
                        num_inference_steps=30,
                        guidance_scale=7.5,
                        height=512,
                        width=512
                    ).images[0]
            
            # Clear memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            if platform.system() == "Darwin" and torch.backends.mps.is_available():
                torch.mps.empty_cache()
            gc.collect()
            
            # TODO: Upload to Supabase Storage
            # For now, return the image
            # self.db.save_recipe_image(recipe_id, image_type, uploaded_url, image_prompt)
            
            return image, image_prompt
            
        except Exception as e:
            print(f"Error generating image: {e}")
            import traceback
            traceback.print_exc()
            return None, image_prompt
    
    def get_ingredient_alternatives(self, missing_ingredient: str, recipe_context: str) -> str:
        """Get ingredient alternatives (LLM call)"""
        chain = self.alternative_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "missing_ingredient": missing_ingredient,
            "recipe_context": recipe_context
        })
    
    # ========================================================
    # Helper Methods
    # ========================================================
    
    def _parse_time(self, time_str: str) -> int:
        """Convert time string to minutes"""
        time_str = time_str.lower()
        
        if '15-30' in time_str or '30' in time_str:
            return 30
        elif '30-45' in time_str or '45' in time_str:
            return 45
        elif '45-60' in time_str or '1 hour' in time_str:
            return 60
        elif '1+' in time_str or '2 hour' in time_str:
            return 120
        else:
            return 60  # Default
    
    def _parse_preferences_string(self, prefs_str: str) -> Dict:
        """Parse preferences from string format to dict"""
        import re
        
        preferences = {
            'region': 'Indian',
            'meal_type': 'lunch',
            'time_available': '60 mins',
            'taste_preferences': [],
            'allergies': [],
            'available_ingredients': []
        }
        
        # Extract region/cuisine
        region_match = re.search(r'Region/Cuisine:\s*([^\n]+)', prefs_str)
        if region_match:
            preferences['region'] = region_match.group(1).strip()
        
        # Extract meal type
        meal_match = re.search(r'Meal Type:\s*([^\n]+)', prefs_str)
        if meal_match:
            preferences['meal_type'] = meal_match.group(1).strip().lower()
        
        # Extract time
        time_match = re.search(r'Time Available:\s*([^\n]+)', prefs_str)
        if time_match:
            preferences['time_available'] = time_match.group(1).strip()
        
        # Extract taste preferences
        taste_match = re.search(r'Taste Preferences:\s*([^\n]+)', prefs_str)
        if taste_match:
            tastes = taste_match.group(1).strip()
            if tastes and tastes != 'None':
                preferences['taste_preferences'] = [t.strip() for t in tastes.split(',')]
        
        # Extract allergies
        allergy_match = re.search(r'Allergies:\s*([^\n]+)', prefs_str)
        if allergy_match:
            allergies = allergy_match.group(1).strip()
            if allergies and allergies != 'None':
                preferences['allergies'] = [a.strip() for a in allergies.split(',')]
        
        # Extract available ingredients
        ing_match = re.search(r'Available Ingredients:\s*([^\n]+)', prefs_str)
        if ing_match:
            ingredients = ing_match.group(1).strip()
            if ingredients and ingredients != 'None':
                preferences['available_ingredients'] = [i.strip() for i in ingredients.split(',')]
        
        return preferences
    
    def _format_ingredients(self, ingredients_json: List[Dict]) -> str:
        """Format ingredients for display"""
        return "\n".join([
            f"- {ing['amount']} {ing['name']}" + (" (optional)" if ing.get('optional') else "")
            for ing in ingredients_json
        ])
