"""
Visual Prompt Enhancer
Converts action-based cooking descriptions into visually descriptive prompts
that image generation models can understand.
"""

from typing import Dict, List
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser


class VisualPromptEnhancer:
    """
    Enhances cooking step descriptions with visual details
    Solves the problem of action verbs (heat, mix) vs visual descriptions (shimmering, glistening)
    """
    
    # Visual appearance mappings for common ingredients and states
    INGREDIENT_VISUALS = {
        "oil": "thin translucent layer of golden oil coating the surface, creating rippling reflections and light refractions with visible heat shimmer",
        "ghee": "rich golden melted ghee with a glossy sheen and tiny bubbles forming at edges, releasing aromatic steam",
        "butter": "melted butter with foam forming at edges, slight amber browning visible, creamy yellow pools glistening",
        "water": "clear water with fine bubbles rising and breaking the surface, creating gentle movement and reflections",
        "onion": "translucent ivory-white onion pieces with glossy wet surfaces, edges beginning to turn pale golden",
        "onions": "translucent ivory-white onion pieces with glossy wet surfaces, edges beginning to turn pale golden",
        "tomato": "vibrant red tomato pieces with juice releasing, seeds visible, flesh breaking down into pulpy texture",
        "tomatoes": "vibrant red tomato pieces with juice releasing, seeds visible, flesh breaking down into pulpy texture",
        "garlic": "finely minced cream-colored garlic pieces scattered throughout, releasing aromatic oils, slight browning on edges",
        "ginger": "pale yellow finely chopped ginger pieces with fibrous texture visible, releasing fresh aromatic essence",
        "spices": "deep red and golden spice powders coating ingredients, creating rich aromatic layer with visible texture",
        "salt": "fine white salt crystals scattered and dissolving on ingredient surfaces",
        "paneer": "pristine white paneer cubes with firm texture, golden-brown seared crust forming on surfaces, slight charring at edges",
        "bell pepper": "bright colored bell pepper strips with glossy skin, maintaining crisp texture, vivid green/red/yellow hues",
        "capsicum": "bright colored bell pepper strips with glossy skin, maintaining crisp texture, vivid green/red/yellow hues",
        "vegetables": "colorful vegetable pieces with distinct textures and bright natural colors glistening with oil",
        "rice": "individual white rice grains visible, slightly translucent, steam rising between grains",
        "dal": "thick yellow-orange lentil mixture with creamy consistency, bubbles forming and popping on surface",
        "gravy": "rich thick sauce coating all ingredients, deep color with oil pools separating at edges, glossy viscous texture",
        "curry": "thick curry with visible spices floating, deep red-orange color, oil glistening on top, aromatic steam rising",
        "cumin": "dark brown cumin seeds scattered, releasing aromatic oils, slight sizzling",
        "coriander": "earthy brown coriander powder creating aromatic coating with visible granular texture",
        "turmeric": "bright golden-yellow turmeric powder creating vibrant color, slightly dissolved in moisture",
        "chili": "deep red chili powder with fine texture, creating heat-infused red oil tint",
    }
    
    # Cooking state visual descriptions
    STATE_VISUALS = {
        "heating": "beginning to shimmer with rising heat waves distorting the air above, surface starting to glisten",
        "hot": "intensely shimmering with rapid ripples across the surface, light dancing off the heated oils and creating rainbow refractions",
        "boiling": "vigorous bubbles rapidly breaking the surface with explosive steam bursts, liquid churning and splashing",
        "simmering": "gentle bubbles steadily rising and popping, creating delicate surface movement with lazy steam wisps",
        "frying": "aggressive sizzling with oil bubbling violently around ingredients, tiny oil droplets spattering, intense heat visible",
        "sautéing": "ingredients glistening and dancing in hot oil, edges crisping with golden-brown caramelization starting to appear",
        "browning": "rich golden-brown Maillard reaction developing on surfaces, caramelized sugars creating deep amber tones",
        "golden": "beautiful rich golden-brown color with crispy textured edges, glossy caramelized surfaces catching light",
        "caramelizing": "deep amber-brown caramelization with glossy sticky surface, sugars breaking down into rich molasses tones",
        "mixing": "ingredients swirling together in fluid motion, colors marbling and blending, textures intertwining",
        "stirring": "ingredients in active motion with slight blur, surfaces catching different angles of light as they move",
        "cooking": "active transformation with steam billowing upward, moisture evaporating, colors intensifying and deepening",
        "thickening": "sauce visibly reducing and concentrating, becoming glossy and viscous, coating spoon heavily when lifted",
        "melting": "solid structures softening and liquefying, edges dissolving, creating creamy pooling textures",
        "ingredients being added": "fresh ingredients just landing on the hot surface, beginning to make contact, initial sizzle starting",
    }
    
    # Preparation state visuals
    PREPARATION_VISUALS = {
        "chopped": "cut into small uniform pieces with sharp clean edges and defined geometry",
        "diced": "precisely cut into small even cubes with geometric uniformity, each piece distinct",
        "sliced": "thin translucent slices with visible concentric layers and delicate structure",
        "minced": "very finely chopped into tiny granular pieces, almost paste-like consistency with moisture glistening",
        "crushed": "roughly broken into irregular jagged pieces with rustic texture",
        "whole": "intact with natural organic shape and unbroken skin",
        "halved": "cut cleanly in half revealing inner flesh texture and color gradient",
        "frying": "actively cooking with oil bubbling around edges, surfaces turning golden and crispy",
        "fried": "fully cooked with deep golden-brown color, crispy exterior, glistening with absorbed oil",
    }
    
    def __init__(self, llm):
        """Initialize with language model for advanced enhancement"""
        self.llm = llm
    
    def enhance_for_image_generation(
        self, 
        ingredients: List[str],
        cooking_state: str,
        preparation_states: Dict[str, str] = None
    ) -> str:
        """
        Convert cooking state into visually descriptive prompt
        
        Args:
            ingredients: List of ingredient names currently visible
            cooking_state: Current cooking state (heating, frying, etc.)
            preparation_states: Dict of ingredient -> preparation state
            
        Returns:
            Visually descriptive prompt suitable for image generation
        """
        preparation_states = preparation_states or {}
        
        # Build visual descriptions for each ingredient
        visual_ingredients = []
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            
            # Get base visual for ingredient
            base_visual = self.INGREDIENT_VISUALS.get(
                ingredient_lower, 
                f"{ingredient}"
            )
            
            # Add preparation visual if available
            prep_state = preparation_states.get(ingredient, "").lower()
            if prep_state and prep_state in self.PREPARATION_VISUALS:
                prep_visual = self.PREPARATION_VISUALS[prep_state]
                base_visual = f"{base_visual} ({prep_visual})"
            
            visual_ingredients.append(base_visual)
        
        # Get cooking state visual
        state_lower = cooking_state.lower()
        state_visual = self.STATE_VISUALS.get(state_lower, cooking_state)
        
        # Combine into descriptive scene
        if visual_ingredients:
            ingredients_desc = ", ".join(visual_ingredients)
            visual_prompt = (
                f"{ingredients_desc} - {state_visual}. "
                f"Close-up view capturing intricate textures, color gradients, and surface details. "
                f"Warm natural kitchen lighting creating highlights and gentle shadows on ingredients. "
                f"Visible steam wisps rising, oil glistening with light reflections, heat effects apparent. "
                f"Ingredients arranged with depth - some in sharp focus in foreground, others softly blurred in background."
            )
        else:
            # No ingredients yet - but might be oil/ghee heating
            # Check if this is an oil/heating step
            if "heat" in state_lower or "oil" in cooking_state.lower():
                visual_prompt = (
                    f"Thin translucent layer of golden oil coating the cooking surface, "
                    f"creating rippling reflections and rainbow refractions in the overhead light. "
                    f"Visible heat shimmer distorting the air above, gentle convection ripples moving across the oil surface. "
                    f"Clean metallic cooking vessel centered in frame with oil glistening intensely. "
                    f"Warm ambient lighting highlighting the liquid's translucent golden color. "
                    f"Shallow depth of field with soft bokeh background."
                )
            else:
                # Other preparation stage
                visual_prompt = (
                    f"Cooking vessel {state_visual}. "
                    f"Clean metallic surface reflecting overhead light. "
                    f"Kitchen stove setting ready for cooking."
                )
        
        return visual_prompt
    
    def enhance_with_llm(
        self,
        ingredients: List[str],
        cooking_state: str,
        step_description: str
    ) -> str:
        """
        Use LLM to generate highly visual descriptions
        For complex states that need more nuanced description
        """
        enhancement_prompt = PromptTemplate(
            template="""Convert this cooking step into a RICH VISUAL description for professional food photography.

Step: {step_description}
Ingredients visible: {ingredients}
Cooking state: {cooking_state}

Your task: Describe what this scene LOOKS like with MAXIMUM sensory detail.

Focus on (be VERY specific):
1. COLORS: Exact hues, gradients, color transitions (golden-brown, deep red, ivory-white, etc.)
2. TEXTURES: Surface qualities (glistening, crispy, glossy, rough, smooth, bubbling, etc.)
3. LIGHT/REFLECTIONS: How light interacts (shimmering, reflecting, refracting, glowing, etc.)
4. STEAM/HEAT: Visible heat effects (steam rising, heat waves, moisture, condensation)
5. SPATIAL ARRANGEMENT: Where ingredients are positioned (foreground, scattered, layered, coating, etc.)
6. MOTION/ACTIVITY: Any movement (sizzling, bubbling, popping, swirling, etc.)

Bad example: "Heat oil in pan"
Good example: "Thin translucent layer of golden oil rippling across the metallic surface, creating rainbow refractions in the overhead light, gentle heat shimmer distorting the air just above"

Bad example: "Add onions and stir"  
Good example: "Translucent ivory-white onion pieces with glossy wet surfaces glistening in oil, edges beginning to turn pale golden-brown with slight caramelization, scattered throughout with visible sizzle and tiny bubbles forming around each piece"

Bad example: "Fry paneer"
Good example: "Pristine white paneer cubes with golden-brown seared crust forming on visible surfaces, slight charring at edges creating textural contrast, oil bubbling aggressively around each cube with intense heat visible"

Write 2-4 sentences. Be EXTREMELY specific about colors, textures, light, and spatial composition. Use vivid sensory language.""",
            input_variables=["step_description", "ingredients", "cooking_state"]
        )
        
        chain = enhancement_prompt | self.llm | StrOutputParser()
        
        visual_description = chain.invoke({
            "step_description": step_description,
            "ingredients": ", ".join(ingredients) if ingredients else "none yet",
            "cooking_state": cooking_state
        })
        
        return visual_description.strip()
    
    def add_negative_constraints(
        self,
        absent_ingredients: List[str],
        recipe_name: str
    ) -> str:
        """
        Generate specific negative prompts
        Note: Does NOT include generic "liquid" or "fluid" to avoid blocking oil
        """
        # Be very specific about what to exclude
        specific_negatives = []
        
        for ingredient in absent_ingredients:
            ingredient_lower = ingredient.lower()
            # Add the ingredient itself
            specific_negatives.append(ingredient)
            
            # Add common forms
            if ingredient_lower not in ["oil", "ghee", "butter", "water"]:
                # Don't block cooking liquids
                specific_negatives.append(f"visible {ingredient}")
        
        # Add finishing/plating negatives
        finishing_negatives = [
            f"completed {recipe_name}",
            f"finished {recipe_name}",
            "final plated dish",
            "garnished dish",
            "serving presentation",
            "plated food",
            "restaurant plating",
            "garnishing",
            "cilantro garnish",
            "fresh herbs on top"
        ]
        
        all_negatives = specific_negatives + finishing_negatives
        
        return f"Do not show: {', '.join(all_negatives)}. No text or labels."
