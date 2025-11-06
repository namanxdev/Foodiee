"""
Visual State Models for Recipe Image Generation
Based on the canonical state model approach
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class IngredientState(BaseModel):
    """State of a single ingredient"""
    name: str
    visible: bool  # visible in pan now?
    preparation: Optional[str] = None  # "frying", "fried", "chopped", etc.
    quantity: Optional[str] = None  # for tracking amounts


class VisualState(BaseModel):
    """Complete visual state at a specific step"""
    step_number: int
    visible_ingredients: List[IngredientState]
    absent_ingredients: List[str]  # names known but not in pan
    pan_state: str  # e.g., "oil shimmering", "masala thickening"
    utensil: str = "pan"
    flame_level: str = "medium"
    lighting: str = "natural"
    camera_angle: str = "slightly top-down"
    
    def get_visible_ingredient_names(self) -> List[str]:
        """Get list of visible ingredient names only"""
        return [ing.name for ing in self.visible_ingredients if ing.visible]
    
    def to_prompt_dict(self) -> Dict[str, str]:
        """Convert to dictionary for prompt generation"""
        visible_names = self.get_visible_ingredient_names()
        return {
            "visible_ingredients": ", ".join(visible_names) if visible_names else "empty pan",
            "pan_state": self.pan_state,
            "utensil": self.utensil,
            "flame_level": self.flame_level,
            "absent_ingredients": ", ".join(self.absent_ingredients)
        }


class StepAction(BaseModel):
    """Parsed action from a recipe step"""
    step_number: int
    action_type: str  # "fry", "saute", "add", "simmer", etc.
    ingredients_added: List[str] = Field(default_factory=list)
    ingredients_removed: List[str] = Field(default_factory=list)
    visible_change: Dict[str, str] = Field(default_factory=dict)  # {"onion": "browning", "paneer": "fried"}
    pan_state_text: Optional[str] = None
    confidence: float = 1.0
    raw_text: str = ""  # Original step text for reference


class RecipeVisualStateManager:
    """Manages the visual state throughout a recipe"""
    
    def __init__(self, recipe_name: str, all_ingredients: List[str]):
        self.recipe_name = recipe_name
        self.all_ingredients = set(all_ingredients)
        self.current_state = VisualState(
            step_number=0,
            visible_ingredients=[],
            absent_ingredients=list(all_ingredients),
            pan_state="empty, clean pan"
        )
        self.state_history: List[VisualState] = []
        self.actions_history: List[StepAction] = []
    
    def apply_action(self, action: StepAction) -> VisualState:
        """Apply a step action to update the visual state"""
        # Save current state to history
        self.state_history.append(self.current_state.model_copy())
        self.actions_history.append(action)
        
        # Create new state
        new_visible_ingredients = self.current_state.visible_ingredients.copy()
        new_absent_ingredients = self.current_state.absent_ingredients.copy()
        
        # Process removed ingredients
        for ingredient in action.ingredients_removed:
            # Remove from visible
            new_visible_ingredients = [
                ing for ing in new_visible_ingredients 
                if ing.name.lower() != ingredient.lower()
            ]
            # Add to absent if it was a known ingredient
            if ingredient in self.all_ingredients and ingredient not in new_absent_ingredients:
                new_absent_ingredients.append(ingredient)
        
        # Process added ingredients
        for ingredient in action.ingredients_added:
            # Remove from absent
            if ingredient in new_absent_ingredients:
                new_absent_ingredients.remove(ingredient)
            
            # Add to visible if not already there
            if not any(ing.name.lower() == ingredient.lower() for ing in new_visible_ingredients):
                preparation = action.visible_change.get(ingredient, "fresh")
                new_visible_ingredients.append(
                    IngredientState(
                        name=ingredient,
                        visible=True,
                        preparation=preparation
                    )
                )
        
        # Apply visible changes to existing ingredients
        for ing in new_visible_ingredients:
            if ing.name in action.visible_change:
                ing.preparation = action.visible_change[ing.name]
        
        # Update pan state
        new_pan_state = action.pan_state_text or self.current_state.pan_state
        
        # Create new state
        self.current_state = VisualState(
            step_number=action.step_number,
            visible_ingredients=new_visible_ingredients,
            absent_ingredients=new_absent_ingredients,
            pan_state=new_pan_state,
            utensil=self.current_state.utensil,
            flame_level=self.current_state.flame_level
        )
        
        return self.current_state
    
    def get_state_at_step(self, step_number: int) -> Optional[VisualState]:
        """Get the visual state at a specific step"""
        if step_number == self.current_state.step_number:
            return self.current_state
        
        for state in self.state_history:
            if state.step_number == step_number:
                return state
        
        return None
    
    def reset_to_step(self, step_number: int):
        """Reset state to a specific step"""
        state = self.get_state_at_step(step_number)
        if state:
            self.current_state = state.model_copy()
            # Remove future states from history
            self.state_history = [s for s in self.state_history if s.step_number <= step_number]
            self.actions_history = [a for a in self.actions_history if a.step_number <= step_number]
