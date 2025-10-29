"""
Database-First Recipe Recommender
Uses structured database queries for fast, precise recipe retrieval
"""

from typing import List, Dict
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from config import embeddings
from prompts import RecipePrompts
from database.db_helpers import RecipeDatabase
from core.base_recommender import BaseRecommender


class OptimizedRecipeRecommender(BaseRecommender):
    """
    Optimized recommender that uses database-first approach
    - 95% database queries (fast!)
    - 5% LLM calls (only for ranking/personalization)
    """
    
    def __init__(self, db: RecipeDatabase):
        """Initialize database-first recommender"""
        super().__init__()
        self.db = db
    
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
        
        # Use ranking prompt from RecipePrompts
        ranking_prompt = RecipePrompts.get_ranking_prompt()
        chain = ranking_prompt | self.llm | StrOutputParser()
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
            # Use step breakdown prompt from RecipePrompts
            breakdown_prompt = RecipePrompts.get_step_breakdown_prompt()
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
    # Image Generation (inherited from BaseRecommender)
    # ========================================================
    # - generate_image_with_gemini()
    # - generate_image_with_stable_diffusion()
    # - generate_image_prompt()
    # - get_ingredient_alternatives()
    
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
