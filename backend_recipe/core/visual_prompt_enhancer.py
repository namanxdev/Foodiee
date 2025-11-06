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
        "oil": "thin shimmering layer of oil coating the surface, reflecting light",
        "ghee": "glossy melted ghee with a golden sheen",
        "butter": "melted butter with slight browning at edges",
        "water": "clear water with small bubbles forming",
        "onions": "translucent onion pieces",
        "tomatoes": "red tomato pieces with visible juice",
        "garlic": "minced garlic pieces scattered",
        "ginger": "finely chopped ginger visible",
        "spices": "aromatic spice powder coating ingredients",
        "salt": "fine salt crystals sprinkled",
        "paneer": "white paneer cubes with golden edges",
        "vegetables": "colorful vegetable pieces",
        "rice": "white rice grains",
        "dal": "yellow lentils with thick consistency",
        "gravy": "rich, thick sauce coating ingredients",
        "curry": "thick curry with visible spices",
    }
    
    # Cooking state visual descriptions
    STATE_VISUALS = {
        "heating": "beginning to shimmer with heat waves visible",
        "hot": "shimmering and reflecting light, slight ripples from heat",
        "boiling": "vigorous bubbles breaking the surface",
        "simmering": "gentle bubbles rising slowly",
        "frying": "sizzling with oil bubbling around ingredients",
        "sautéing": "ingredients glistening, slight browning visible",
        "browning": "golden-brown color developing on surfaces",
        "golden": "rich golden-brown color with crispy edges",
        "caramelizing": "deep golden brown with glossy surface",
        "mixing": "ingredients swirling together, colors blending",
        "stirring": "ingredients moving, visible motion blur",
        "cooking": "steam rising, moisture evaporating, colors deepening",
        "thickening": "sauce reducing, becoming viscous and glossy",
        "melting": "transitioning from solid to liquid, edges softening",
    }
    
    # Preparation state visuals
    PREPARATION_VISUALS = {
        "chopped": "cut into small uniform pieces with clean edges",
        "diced": "cut into small cubes, evenly sized",
        "sliced": "thin slices with visible layers",
        "minced": "very finely chopped, almost paste-like",
        "crushed": "roughly broken with irregular pieces",
        "whole": "intact with natural shape",
        "halved": "cut in half showing inner texture",
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
                f"Close-up view showing texture and details. "
                f"Natural kitchen lighting highlighting the ingredients. "
                f"Steam and heat visible where appropriate."
            )
        else:
            # No ingredients yet - but might be oil/ghee heating
            # Check if this is an oil/heating step
            if "heat" in state_lower or "oil" in cooking_state.lower():
                visual_prompt = (
                    f"Thin shimmering layer of oil coating the cooking surface, "
                    f"reflecting overhead light with gentle ripples from heat. "
                    f"Slight heat haze visible rising from the surface. "
                    f"Clean metallic cooking vessel on stove. "
                    f"Oil glistening and beginning to shimmer."
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
            template="""Convert this cooking step into a VISUAL description for image generation.

Step: {step_description}
Ingredients visible: {ingredients}
Cooking state: {cooking_state}

Your task: Describe what this scene LOOKS like, not what's being done.
Focus on:
- Visual appearance (colors, textures, reflections)
- Physical state (shimmering, bubbling, browning)
- Light and reflections
- Textures and surfaces
- What the human eye would see

Bad example: "Heat oil in pan"
Good example: "Thin layer of oil coating the pan surface, shimmering with heat, creating small ripples and light reflections"

Bad example: "Add onions and stir"
Good example: "Translucent onion pieces glistening with oil, beginning to turn golden at edges, scattered across pan surface"

Write ONLY the visual description (2-3 sentences max). Be specific and sensory.""",
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
