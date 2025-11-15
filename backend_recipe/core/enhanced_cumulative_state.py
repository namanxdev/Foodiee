"""
Enhanced Cumulative State System
Integrates visual state management, step parsing, and prompt generation
"""

from typing import List, Dict, Optional, Tuple
import json

from .visual_state_models import RecipeVisualStateManager, StepAction
from .step_parser import DeterministicStepParser
from .visual_prompt_generator import VisualPromptGenerator, EnhancedImageGenerator


class EnhancedCumulativeState:
    """
    Enhanced state management that addresses all the issues:
    - Maintains canonical visual state
    - Uses deterministic parsing
    - Generates prompts from state, not text
    - Implements negative prompting
    - Provides session isolation
    """
    
    def __init__(self, llm, recipe_name: str, all_ingredients: List[str]):
        """
        Initialize enhanced cumulative state
        
        Args:
            llm: Language model for parsing
            recipe_name: Name of the recipe
            all_ingredients: Complete list of ingredients
        """
        self.llm = llm
        self.recipe_name = recipe_name
        self.all_ingredients = all_ingredients
        
        # Initialize components
        self.state_manager = RecipeVisualStateManager(recipe_name, all_ingredients)
        self.step_parser = DeterministicStepParser(llm, all_ingredients)
        self.prompt_generator = VisualPromptGenerator(recipe_name)
        
        # Track parsing confidence
        self.step_confidences: Dict[int, float] = {}
    
    def process_step(
        self, 
        step_number: int, 
        step_text: str
    ) -> Tuple[Dict[str, str], StepAction]:
        """
        Process a recipe step and return prompts for image generation
        
        Args:
            step_number: Step number (0-indexed)
            step_text: Text description of the step
            
        Returns:
            Tuple of (prompts_dict, parsed_action)
        """
        # Parse the step into structured action
        action = self.step_parser.parse_step(step_text, step_number)
        
        # Apply action to visual state
        new_state = self.state_manager.apply_action(action)
        
        # Track confidence
        self.step_confidences[step_number] = action.confidence
        
        # Generate prompts from state
        prompts = self.prompt_generator.generate_prompts(
            new_state,
            step_text,
            action.confidence
        )
        
        # Log the processing
        self._log_step_processing(step_number, step_text, action, new_state)
        
        return prompts, action
    
    def get_image_prompt(self, step_number: int, step_text: str) -> str:
        """
        Get complete image generation prompt for a step
        
        Args:
            step_number: Step number
            step_text: Step description
            
        Returns:
            Complete prompt for image generation
        """
        prompts, _ = self.process_step(step_number, step_text)
        
        # Combine prompts for Gemini-style API
        full_prompt = f"""{prompts['positive']}

STRICT REQUIREMENTS - MUST NOT SHOW:
{prompts['negative']}

{prompts['style_suffix']}"""
        
        if 'note' in prompts:
            full_prompt = f"[{prompts['note']}]\n\n{full_prompt}"
        
        return full_prompt
    
    def get_current_state_summary(self) -> Dict:
        """Get summary of current visual state"""
        current = self.state_manager.current_state
        return {
            "step_number": current.step_number,
            "visible_ingredients": [
                {
                    "name": ing.name,
                    "preparation": ing.preparation
                }
                for ing in current.visible_ingredients
            ],
            "absent_ingredients": current.absent_ingredients,
            "pan_state": current.pan_state,
            "total_steps_processed": len(self.state_manager.state_history),
            "average_confidence": sum(self.step_confidences.values()) / len(self.step_confidences) if self.step_confidences else 0
        }
    
    def _log_step_processing(
        self, 
        step_number: int,
        step_text: str,
        action: StepAction,
        new_state
    ):
        """Log step processing for debugging"""
        print(f"\n=== Step {step_number} Processing ===")
        print(f"Text: {step_text}")
        print(f"Parsed Action: {action.action_type}")
        print(f"Added: {action.ingredients_added}")
        print(f"Removed: {action.ingredients_removed}")
        print(f"Visible now: {[ing.name for ing in new_state.visible_ingredients]}")
        print(f"Absent: {new_state.absent_ingredients}")
        print(f"Confidence: {action.confidence:.2f}")
    
    def save_to_dict(self) -> Dict:
        """Save state to dictionary for persistence"""
        return {
            "recipe_name": self.recipe_name,
            "all_ingredients": self.all_ingredients,
            "current_state": self.state_manager.current_state.model_dump(),
            "state_history": [state.model_dump() for state in self.state_manager.state_history],
            "actions_history": [action.model_dump() for action in self.state_manager.actions_history],
            "step_confidences": self.step_confidences
        }
    
    @classmethod
    def load_from_dict(cls, data: Dict, llm):
        """Load state from dictionary"""
        instance = cls(
            llm=llm,
            recipe_name=data["recipe_name"],
            all_ingredients=data["all_ingredients"]
        )
        
        # Restore state
        from .visual_state_models import VisualState
        instance.state_manager.current_state = VisualState(**data["current_state"])
        instance.state_manager.state_history = [
            VisualState(**state) for state in data["state_history"]
        ]
        instance.state_manager.actions_history = [
            StepAction(**action) for action in data["actions_history"]
        ]
        instance.step_confidences = data["step_confidences"]
        
        return instance


def integrate_with_existing_system(
    base_image_generator,
    llm,
    recipe_name: str,
    step_text: str,
    step_index: int,
    all_ingredients: List[str],
    session_id: str
) -> Tuple[Optional[str], str]:
    """
    Integration function for existing image generation system
    
    This can be called from the existing generate_image_with_gemini method
    """
    # Create or retrieve enhanced state for session
    # In production, this would use Redis or session storage
    state = EnhancedCumulativeState(
        llm=llm,
        recipe_name=recipe_name,
        all_ingredients=all_ingredients
    )
    
    # Get enhanced prompt
    prompt = state.get_image_prompt(step_index, step_text)
    
    # Generate image with enhanced prompt
    enhanced_gen = EnhancedImageGenerator(base_image_generator)
    visual_state = state.state_manager.current_state
    
    return enhanced_gen.generate_with_visual_state(
        recipe_name,
        step_text,
        visual_state,
        state.step_confidences.get(step_index, 1.0)
    )
