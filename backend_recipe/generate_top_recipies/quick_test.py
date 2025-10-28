"""
Quick test with just 1 batch (10 recipes) for Italian cuisine
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Temporarily override settings for quick test
import generate_top_recipies as gen_module
gen_module.RECIPES_PER_REGION = 10  # Just 1 batch for testing

from generate_top_recipies import (
    initialize_gemini,
    get_db_connection,
    generate_recipes_for_region
)

def quick_test():
    """Quick test with 10 recipes."""
    print("🧪 QUICK TEST - Generating 10 Italian recipes")
    print("="*60)
    
    # Initialize
    model = initialize_gemini()
    conn = get_db_connection()
    
    # Generate recipes
    generate_recipes_for_region(model, conn, "Italian")
    
    conn.close()
    print("\n✅ Quick test complete!")

if __name__ == "__main__":
    quick_test()
