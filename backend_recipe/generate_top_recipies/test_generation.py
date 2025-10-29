"""
Test script to generate recipes for a single region
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_top_recipies import (
    initialize_gemini,
    get_db_connection,
    generate_recipes_for_region
)

def test_single_region(region: str = "Italian"):
    """Test recipe generation for a single region."""
    print(f"🧪 Testing recipe generation for: {region}")
    print("="*60)
    
    # Initialize
    model = initialize_gemini()
    conn = get_db_connection()
    
    # Generate recipes
    generate_recipes_for_region(model, conn, region)
    
    conn.close()
    print("\n✅ Test complete!")

if __name__ == "__main__":
    region = sys.argv[1] if len(sys.argv) > 1 else "Italian"
    test_single_region(region)
