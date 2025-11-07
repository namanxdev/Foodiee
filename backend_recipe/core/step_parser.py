"""
Deterministic Step Parser for Recipe Instructions
Converts free-text recipe steps into structured StepAction objects
"""

import re
import json
from typing import List, Dict, Tuple, Optional
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate

from .visual_state_models import StepAction


class DeterministicStepParser:
    """Parse recipe steps into structured actions with high confidence"""
    
    # Common cooking action verbs
    COOKING_ACTIONS = {
        "add": ["add", "put", "place", "throw", "pour", "sprinkle"],
        "fry": ["fry", "deep fry", "shallow fry", "pan fry"],
        "saute": ["saute", "sauté", "toss", "stir fry"],
        "cook": ["cook", "heat", "warm"],
        "simmer": ["simmer", "boil", "reduce"],
        "remove": ["remove", "take out", "drain", "strain", "discard"],
        "mix": ["mix", "stir", "combine", "blend", "whisk"],
        "prepare": ["chop", "dice", "slice", "mince", "grate", "crush"]
    }
    
    # Visual state indicators
    STATE_INDICATORS = {
        "browning": ["brown", "golden", "caramelized"],
        "softening": ["soft", "tender", "translucent"],
        "thickening": ["thick", "reduced", "coating"],
        "bubbling": ["boiling", "simmering", "bubbling"],
        "melting": ["melted", "melting"]
    }
    
    def __init__(self, llm, all_ingredients: List[str]):
        """
        Initialize parser with LLM and known ingredients
        
        Args:
            llm: Language model for complex parsing
            all_ingredients: List of all ingredients in the recipe
        """
        self.llm = llm
        self.all_ingredients = [ing.lower() for ing in all_ingredients]
        self.ingredient_patterns = self._build_ingredient_patterns()
    
    def _build_ingredient_patterns(self) -> List[Tuple[str, re.Pattern]]:
        """Build regex patterns for ingredient detection"""
        patterns = []
        for ingredient in self.all_ingredients:
            # Create pattern that matches ingredient with word boundaries
            # Handle multi-word ingredients
            escaped = re.escape(ingredient)
            pattern = re.compile(r'\b' + escaped + r'\b', re.IGNORECASE)
            patterns.append((ingredient, pattern))
        return sorted(patterns, key=lambda x: len(x[0]), reverse=True)  # Longest first
    
    def parse_step(self, step_text: str, step_number: int) -> StepAction:
        """
        Parse a recipe step into structured action
        
        Args:
            step_text: The recipe step text
            step_number: The step number
            
        Returns:
            StepAction object with parsed information
        """
        # Try rule-based parsing first
        action = self._rule_based_parse(step_text, step_number)
        
        # If confidence is low, enhance with LLM
        if action.confidence < 0.7:
            action = self._llm_enhanced_parse(step_text, step_number, action)
        
        return action
    
    def _rule_based_parse(self, step_text: str, step_number: int) -> StepAction:
        """Rule-based parsing using patterns and heuristics"""
        step_lower = step_text.lower()
        
        # Detect action type
        action_type = "cook"  # default
        for action, keywords in self.COOKING_ACTIONS.items():
            if any(keyword in step_lower for keyword in keywords):
                action_type = action
                break
        
        # Detect ingredients
        ingredients_added = []
        ingredients_removed = []
        
        # Check for removal keywords
        if any(word in step_lower for word in ["remove", "take out", "drain", "discard"]):
            # This is a removal step
            for ingredient, pattern in self.ingredient_patterns:
                if pattern.search(step_text):
                    ingredients_removed.append(ingredient)
        else:
            # Check for added ingredients
            for ingredient, pattern in self.ingredient_patterns:
                if pattern.search(step_text):
                    # Check if it's being added (not just mentioned)
                    if self._is_ingredient_being_added(step_text, ingredient):
                        ingredients_added.append(ingredient)
        
        # Detect visual changes
        visible_change = {}
        for ingredient in ingredients_added:
            for state, indicators in self.STATE_INDICATORS.items():
                if any(indicator in step_lower for indicator in indicators):
                    visible_change[ingredient] = state
                    break
        
        # Detect pan state
        pan_state = self._detect_pan_state(step_text)
        
        # Calculate confidence
        confidence = self._calculate_confidence(
            step_text, action_type, ingredients_added, ingredients_removed
        )
        
        return StepAction(
            step_number=step_number,
            action_type=action_type,
            ingredients_added=ingredients_added,
            ingredients_removed=ingredients_removed,
            visible_change=visible_change,
            pan_state_text=pan_state,
            confidence=confidence,
            raw_text=step_text
        )
    
    def _is_ingredient_being_added(self, step_text: str, ingredient: str) -> bool:
        """Check if ingredient is actually being added, not just mentioned"""
        step_lower = step_text.lower()
        ingredient_lower = ingredient.lower()
        
        # Patterns that indicate adding
        add_patterns = [
            f"add {ingredient_lower}",
            f"add the {ingredient_lower}",
            f"put {ingredient_lower}",
            f"pour {ingredient_lower}",
            f"place {ingredient_lower}",
            f"throw in {ingredient_lower}",
            f"mix in {ingredient_lower}",
            f"stir in {ingredient_lower}",
            f"{ingredient_lower} and",
            f"{ingredient_lower},",
        ]
        
        return any(pattern in step_lower for pattern in add_patterns)
    
    def _detect_pan_state(self, step_text: str) -> Optional[str]:
        """Detect the state of the pan/cooking vessel"""
        step_lower = step_text.lower()
        
        states = {
            "oil shimmering": ["oil.*hot", "oil.*shimmer", "heat.*oil"],
            "ingredients browning": ["brown", "golden", "carameliz"],
            "sauce thickening": ["thick", "reduce", "coating"],
            "mixture simmering": ["simmer", "bubble", "gentle boil"],
            "dry roasting": ["dry roast", "no oil", "without oil"]
        }
        
        for state, patterns in states.items():
            if any(re.search(pattern, step_lower) for pattern in patterns):
                return state
        
        return None
    
    def _calculate_confidence(
        self, 
        step_text: str, 
        action_type: str,
        ingredients_added: List[str],
        ingredients_removed: List[str]
    ) -> float:
        """Calculate confidence score for the parsing"""
        confidence = 0.5  # Base confidence
        
        # Boost for clear action words
        if action_type != "cook":  # Not default
            confidence += 0.2
        
        # Boost for detected ingredients
        if ingredients_added or ingredients_removed:
            confidence += 0.2
        
        # Boost for simple, clear instructions
        if len(step_text.split()) < 20:
            confidence += 0.1
        
        # Penalize complex or ambiguous instructions
        if "or" in step_text.lower() or "optional" in step_text.lower():
            confidence -= 0.2
        
        return min(max(confidence, 0.0), 1.0)
    
    def _llm_enhanced_parse(
        self, 
        step_text: str, 
        step_number: int,
        initial_parse: StepAction
    ) -> StepAction:
        """Use LLM to enhance parsing for complex steps"""
        
        prompt = PromptTemplate(
            template="""Parse this cooking step into structured information.

Recipe step: "{step_text}"
Available ingredients: {all_ingredients}

Initial parse:
- Action: {action_type}
- Ingredients added: {ingredients_added}
- Ingredients removed: {ingredients_removed}

Please provide a more accurate parse in JSON format:
{{
    "action_type": "one of: add, fry, saute, cook, simmer, remove, mix, prepare",
    "ingredients_added": ["list of ingredients being added to the pan"],
    "ingredients_removed": ["list of ingredients being removed from the pan"],
    "visible_change": {{"ingredient": "state change like 'browning' or 'softening'"}},
    "pan_state": "description of how the pan/contents look",
    "confidence": 0.0-1.0
}}

Be very precise about which ingredients are actually being added vs just mentioned.""",
            input_variables=[
                "step_text", "all_ingredients", "action_type", 
                "ingredients_added", "ingredients_removed"
            ]
        )
        
        chain = LLMChain(llm=self.llm, prompt=prompt)
        
        try:
            result = chain.run(
                step_text=step_text,
                all_ingredients=", ".join(self.all_ingredients),
                action_type=initial_parse.action_type,
                ingredients_added=", ".join(initial_parse.ingredients_added),
                ingredients_removed=", ".join(initial_parse.ingredients_removed)
            )
            
            # Parse JSON response
            parsed = json.loads(result)
            
            # Validate ingredients against known list
            valid_added = [
                ing for ing in parsed.get("ingredients_added", [])
                if ing.lower() in self.all_ingredients
            ]
            valid_removed = [
                ing for ing in parsed.get("ingredients_removed", [])
                if ing.lower() in self.all_ingredients
            ]
            
            return StepAction(
                step_number=step_number,
                action_type=parsed.get("action_type", initial_parse.action_type),
                ingredients_added=valid_added,
                ingredients_removed=valid_removed,
                visible_change=parsed.get("visible_change", {}),
                pan_state_text=parsed.get("pan_state"),
                confidence=parsed.get("confidence", 0.8),
                raw_text=step_text
            )
            
        except Exception as e:
            print(f"LLM parsing failed: {e}, using initial parse")
            return initial_parse
