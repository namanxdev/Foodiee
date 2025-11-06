"""
Cumulative Recipe State Tracking Module
Uses LangChain memory components to track recipe progress and maintain context
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json

# For LangChain v1.0+, memory classes are in langchain_community
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

# Import visual enhancer
from core.visual_prompt_enhancer import VisualPromptEnhancer


class IngredientState(BaseModel):
    """Tracks individual ingredient state"""
    name: str
    visible: bool  # visible in pan now?
    preparation: Optional[str] = None  # "frying", "fried", "chopped", etc.


class VisualState(BaseModel):
    """Canonical visual state at each step"""
    step_number: int
    visible_ingredients: List[IngredientState]
    absent_ingredients: List[str]  # names known but not in pan
    # pan_state: str  # e.g., "oil shimmering", "masala thickening"
    # utensil: str = "pan"
    flame_level: str = "medium"
    lighting: str = "natural"
    camera_angle: str = "slightly top-down"


class StepAction(BaseModel):
    """Structured action extracted from step text"""
    step_number: int
    action_type: str  # "fry", "saute", "add", "simmer", etc.
    ingredients_added: List[str]
    ingredients_removed: List[str]
    visible_change: Dict[str, str]  # {"onion": "browning", "paneer": "fried"}
    confidence: float = 0.0


class RecipeStepState(BaseModel):
    """Model for individual recipe step state"""
    step_index: int
    step_description: str
    action: Optional[StepAction] = None
    visual_state: Optional[VisualState] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class CumulativeRecipeState:
    """
    Manages cumulative state of recipe cooking process
    Tracks what has been done so far to generate accurate images
    """
    
    def __init__(self, llm, recipe_name: str, total_ingredients: List[str]):
        """
        Initialize cumulative recipe state
        
        Args:
            llm: Language model for summarization
            recipe_name: Name of the recipe being cooked
            total_ingredients: Complete list of ingredients for the recipe
        """
        self.llm = llm
        self.recipe_name = recipe_name
        self.total_ingredients = total_ingredients
        
        # Initialize chat history for maintaining context
        self.chat_history = ChatMessageHistory()
        self.max_history_length = 10  # Keep last 10 exchanges
        
        # Track step states
        self.step_states: List[RecipeStepState] = []
        
        # Current visual state
        self.current_visual_state: Optional[VisualState] = None
        
        # Track all ingredients (visible and absent)
        self.visible_ingredients: Dict[str, IngredientState] = {}
        self.absent_ingredients: List[str] = total_ingredients.copy()
        
        # Initialize visual prompt enhancer
        self.visual_enhancer = VisualPromptEnhancer(llm)
        
    def add_step(self, step_index: int, step_description: str) -> VisualState:
        """
        Add a new step to the cumulative state
        
        Args:
            step_index: Index of the current step
            step_description: Description of what's happening in this step
            
        Returns:
            Updated visual state
        """
        print(f"\n🔍 Processing step {step_index}: {step_description}")
        
        # Parse step into structured action
        step_action = self._parse_step_action(step_index, step_description)
        print(f"   📋 Parsed action:")
        print(f"      - Action type: {step_action.action_type}")
        print(f"      - Ingredients added: {step_action.ingredients_added}")
        print(f"      - Visible changes: {step_action.visible_change}")
        print(f"      - Confidence: {step_action.confidence}")
        
        # Update ingredient visibility based on action
        self._update_ingredient_visibility(step_action)
        visible_now = list(self.visible_ingredients.keys())
        print(f"   👁️  Now visible: {visible_now}")
        print(f"   🚫 Still absent: {len(self.absent_ingredients)} ingredients")
        
        # Generate visual state
        visual_state = self._create_visual_state(step_index, step_action)
        
        # Create step state
        step_state = RecipeStepState(
            step_index=step_index,
            step_description=step_description,
            action=step_action,
            visual_state=visual_state
        )
        
        self.step_states.append(step_state)
        self.current_visual_state = visual_state
        
        # Update memory
        self._update_memory(step_description, visual_state)
        
        return visual_state
    
    def _parse_step_action(self, step_index: int, step_description: str) -> StepAction:
        """Parse step into structured action with confidence scoring"""
        from langchain_core.runnables import RunnablePassthrough
        from langchain_core.output_parsers import StrOutputParser
        
        parsing_prompt = PromptTemplate(
            template="""Parse this cooking step. Return ONLY valid JSON, no extra text.

Step: {step_description}
Available: {all_ingredients}
Already visible: {visible_ingredients}

Return JSON with these keys:
{{
  "action_type": "heat|add|fry|saute|simmer|stir|boil|mix|chop|dice",
  "ingredients_added": ["list", "of", "ingredients"],
  "confidence": 0.8
}}

Rules:
1. If step mentions an ingredient (heat oil, add onions, fry paneer), add it to ingredients_added
2. If already visible, don't add again

Return ONLY the JSON object, nothing else.""",
            input_variables=["step_description", "all_ingredients", "visible_ingredients"]
        )
        
        chain = parsing_prompt | self.llm | StrOutputParser()
        visible_names = [ing.name for ing in self.visible_ingredients.values()]
        
        result = chain.invoke({
            "step_description": step_description,
            "all_ingredients": ", ".join(self.total_ingredients),
            "visible_ingredients": ", ".join(visible_names) if visible_names else "none"
        })
        
        try:
            # Try to extract JSON from response (sometimes LLM adds extra text)
            result_clean = result.strip()
            
            # Find JSON object in response
            if '{' in result_clean and '}' in result_clean:
                start = result_clean.index('{')
                end = result_clean.rindex('}') + 1
                json_str = result_clean[start:end]
                parsed = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
            
            return StepAction(
                step_number=step_index,
                action_type=parsed.get("action_type", "unknown"),
                ingredients_added=parsed.get("ingredients_added", []),
                ingredients_removed=parsed.get("ingredients_removed", []),
                visible_change=parsed.get("visible_change", {}),
                confidence=float(parsed.get("confidence", 0.5))
            )
        except Exception as e:
            print(f"❌ Failed to parse step action: {e}")
            print(f"   Raw LLM response: {result[:200]}")
            
            # Try simple regex fallback to extract ingredients
            ingredients = []
            step_lower = step_description.lower()
            
            # Simple pattern matching for common cases
            if self.total_ingredients:
                for ingredient in self.total_ingredients:
                    if ingredient.lower() in step_lower:
                        ingredients.append(ingredient)
            else:
                # If no total_ingredients list, extract from common words
                common_ingredients = ["oil", "onion", "garlic", "ginger", "tomato", "paneer", 
                                    "chili", "spice", "salt", "water", "capsicum", "bell pepper"]
                for ing in common_ingredients:
                    if ing in step_lower:
                        ingredients.append(ing)
            
            # Determine action type from common verbs
            action_type = "unknown"
            if any(word in step_lower for word in ["heat", "warm"]):
                action_type = "heat"
            elif any(word in step_lower for word in ["add", "pour"]):
                action_type = "add"
            elif any(word in step_lower for word in ["fry", "sauté", "saute"]):
                action_type = "fry"
            elif any(word in step_lower for word in ["stir", "mix"]):
                action_type = "stir"
            
            print(f"   🔧 Fallback extraction: action={action_type}, ingredients={ingredients}")
            
            return StepAction(
                step_number=step_index,
                action_type=action_type,
                ingredients_added=ingredients,
                ingredients_removed=[],
                visible_change={},
                confidence=0.6  # Medium confidence for fallback
            )
    
    def _update_ingredient_visibility(self, action: StepAction):
        """Update which ingredients are visible based on the action"""
        # Add new ingredients
        for ingredient_name in action.ingredients_added:
            if ingredient_name in self.absent_ingredients:
                self.absent_ingredients.remove(ingredient_name)
            
            # Determine preparation state from action
            preparation = None
            if action.action_type in ["chop", "dice", "slice"]:
                preparation = "chopped"
            elif action.action_type in ["fry", "saute"]:
                preparation = "frying"
            
            self.visible_ingredients[ingredient_name] = IngredientState(
                name=ingredient_name,
                visible=True,
                preparation=preparation
            )
        
        # Remove ingredients (rare)
        for ingredient_name in action.ingredients_removed:
            if ingredient_name in self.visible_ingredients:
                del self.visible_ingredients[ingredient_name]
                if ingredient_name not in self.absent_ingredients:
                    self.absent_ingredients.append(ingredient_name)
        
        # Update preparation states based on visible changes
        for ingredient_name, change in action.visible_change.items():
            if ingredient_name in self.visible_ingredients:
                self.visible_ingredients[ingredient_name].preparation = change
    
    def _create_visual_state(self, step_index: int, action: StepAction) -> VisualState:
        """Create visual state from current ingredients and action"""
        # Convert visible ingredients to list
        visible_list = list(self.visible_ingredients.values())
        
        # Adjust flame level based on action
        flame_level = "medium"
        if action.action_type in ["fry", "saute"]:
            flame_level = "high"
        elif action.action_type in ["simmer", "slow cook"]:
            flame_level = "low"
        
        return VisualState(
            step_number=step_index,
            visible_ingredients=visible_list,
            absent_ingredients=self.absent_ingredients.copy(),
            flame_level=flame_level
        )
    
    def _update_memory(self, step_description: str, visual_state: VisualState):
        """Update chat history with step information"""
        # Add step as human message
        self.chat_history.add_user_message(
            f"Step {visual_state.step_number}: {step_description}"
        )
        
        # Add visual state summary as AI message
        visible_names = [ing.name for ing in visual_state.visible_ingredients]
        self.chat_history.add_ai_message(
            f"Visible: {', '.join(visible_names)}"
        )
        
        # Trim history if it gets too long
        messages = self.chat_history.messages
        if len(messages) > self.max_history_length * 2:  # 2 messages per step
            # Keep only the most recent messages
            self.chat_history.clear()
            for msg in messages[-(self.max_history_length * 2):]:
                self.chat_history.add_message(msg)
    
    def get_cumulative_prompt(self, current_step_description: str, confidence_threshold: float = 0.7) -> Dict[str, str]:
        """
        Generate prompt following instructions.md format with negative prompting
        
        Args:
            current_step_description: Description of the current step
            confidence_threshold: Minimum confidence to use full state (else conservative)
            
        Returns:
            Dict with 'positive' and 'negative' prompts
        """
        if not self.current_visual_state:
            # Very first step - conservative
            return self._get_conservative_prompt()
        
        # Check confidence
        last_action = self.step_states[-1].action if self.step_states else None
        if last_action and last_action.confidence < confidence_threshold:
            return self._get_conservative_prompt()
        
        # Get ingredient names and preparation states
        visible_names = [ing.name for ing in self.current_visual_state.visible_ingredients]
        preparation_map = {
            ing.name: ing.preparation 
            for ing in self.current_visual_state.visible_ingredients 
            if ing.preparation
        }
        
        # Derive cooking_state from action_type
        state_map = {
            "heat": "heating",
            "add": "ingredients being added",
            "fry": "frying",
            "saute": "sautéing",
            "simmer": "simmering",
            "stir": "being stirred",
            "mix": "ingredients mixing",
            "boil": "boiling",
            "cook": "cooking"
        }
        cooking_state = state_map.get(last_action.action_type, "cooking") if last_action else "cooking"
        
        # Use visual enhancer to create descriptive prompt
        print(f"\n🎨 Generating visual prompt:")
        print(f"   Visible ingredients to describe: {visible_names}")
        print(f"   Cooking state: {cooking_state}")
        
        try:
            visual_description = self.visual_enhancer.enhance_with_llm(
                ingredients=visible_names,
                cooking_state=cooking_state,
                step_description=current_step_description
            )
            print(f"   ✅ LLM visual description: {visual_description[:100]}...")
            
            # Build final positive prompt
            positive = (
                f"Professional food photography: {visual_description}. "
                f"Close-up kitchen scene with natural lighting from above. "
                f"Sharp focus on textures and details. "
                f"Realistic, in-progress cooking, NOT a finished plated dish."
            )
        except Exception as e:
            print(f"⚠️  Visual enhancement failed: {e}, using fallback")
            # Fallback to rule-based enhancement
            visual_description = self.visual_enhancer.enhance_for_image_generation(
                ingredients=visible_names,
                cooking_state=cooking_state,
                preparation_states=preparation_map
            )
            print(f"   📝 Rule-based description: {visual_description[:100]}...")
            positive = f"Professional food photography: {visual_description}"
        
        # Build negative prompt using enhancer (avoids blocking oil/liquids)
        negative = self.visual_enhancer.add_negative_constraints(
            absent_ingredients=self.current_visual_state.absent_ingredients,
            recipe_name=self.recipe_name
        )
        
        return {
            "positive": positive,
            "negative": negative,
            "metadata": {
                "confidence": last_action.confidence if last_action else 0.0,
                "step_number": self.current_visual_state.step_number,
                "visible_count": len(visible_names),
                "absent_count": len(self.current_visual_state.absent_ingredients)
            }
        }
    
    def _get_conservative_prompt(self) -> Dict[str, str]:
        """Conservative fallback prompt when confidence is low"""
        return {
            "positive": (
                f"Professional food photography of early cooking preparation stage. "
                "Clean cooking setup with basic cooking equipment. "
                "Natural lighting, slightly overhead angle. "
                "Realistic cooking scene, NOT finished dish. "
                "Warm, inviting kitchen atmosphere."
            ),
            "negative": (
                f"Do not show {self.recipe_name} finished. "
                "No completed dishes, no plating, no garnishing. "
                "No specific food ingredients. "
                "No text, labels, or watermarks."
            ),
            "metadata": {
                "confidence": 0.0,
                "fallback": True
            }
        }
    
    def get_state_summary(self) -> Dict:
        """Get a summary of the current recipe state"""
        visible_ingredients = []
        if self.current_visual_state:
            visible_ingredients = [ing.name for ing in self.current_visual_state.visible_ingredients]
        
        return {
            "recipe_name": self.recipe_name,
            "steps_completed": len(self.step_states),
            "current_visual_state": self.current_visual_state.dict() if self.current_visual_state else None,
            "visible_ingredients": visible_ingredients,
            "absent_ingredients": self.absent_ingredients,
            "step_history": [
                {
                    "index": s.step_index,
                    "description": s.step_description,
                    "action": s.action.dict() if s.action else None,
                    "visual_state": s.visual_state.dict() if s.visual_state else None
                }
                for s in self.step_states
            ]
        }
    
    def reset(self):
        """Reset the cumulative state"""
        self.step_states.clear()
        self.current_visual_state = None
        self.visible_ingredients.clear()
        self.absent_ingredients = self.total_ingredients.copy()
        self.chat_history.clear()
