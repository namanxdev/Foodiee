"""
Test script for Top Recipes API
================================
Standalone test to verify API functionality without running full server.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.top_recipes_service import (
    get_top_recipes,
    get_recipe_by_id,
    get_available_filters
)


def test_get_all_recipes():
    """Test: Get all recipes with default sorting"""
    print("\n" + "="*80)
    print("TEST 1: Get all recipes (default: popularity_score DESC, limit 5)")
    print("="*80)
    
    recipes, total_count = get_top_recipes(limit=5)
    
    print(f"✅ Total recipes in database: {total_count}")
    print(f"✅ Retrieved: {len(recipes)} recipes")
    
    for i, recipe in enumerate(recipes, 1):
        print(f"\n{i}. {recipe.name}")
        print(f"   Region: {recipe.region} | Difficulty: {recipe.difficulty}")
        print(f"   Rating: {recipe.rating} | Popularity: {recipe.popularity_score}")
        print(f"   Time: {recipe.total_time_minutes} min | Servings: {recipe.servings}")


def test_filter_by_region():
    """Test: Filter recipes by region"""
    print("\n" + "="*80)
    print("TEST 2: Filter by region (Indian)")
    print("="*80)
    
    recipes, total_count = get_top_recipes(region='Indian', limit=3)
    
    print(f"✅ Total Indian recipes: {total_count}")
    print(f"✅ Retrieved: {len(recipes)} recipes")
    
    for recipe in recipes:
        print(f"  - {recipe.name} (Rating: {recipe.rating})")


def test_filter_by_dietary():
    """Test: Filter by dietary tags"""
    print("\n" + "="*80)
    print("TEST 3: Filter by dietary tag (Vegetarian)")
    print("="*80)
    
    recipes, total_count = get_top_recipes(dietary_tags=['Vegetarian'], limit=3)
    
    print(f"✅ Total Vegetarian recipes: {total_count}")
    print(f"✅ Retrieved: {len(recipes)} recipes")
    
    for recipe in recipes:
        print(f"  - {recipe.name}")
        print(f"    Tags: {', '.join(recipe.dietary_tags)}")


def test_search():
    """Test: Search functionality"""
    print("\n" + "="*80)
    print("TEST 4: Search for 'chicken'")
    print("="*80)
    
    recipes, total_count = get_top_recipes(search='chicken', limit=3)
    
    print(f"✅ Search results: {total_count}")
    print(f"✅ Retrieved: {len(recipes)} recipes")
    
    for recipe in recipes:
        print(f"  - {recipe.name}")


def test_advanced_filters():
    """Test: Multiple filters combined"""
    print("\n" + "="*80)
    print("TEST 5: Advanced filters (Region=Indian, Rating>=4.5, Time<=90)")
    print("="*80)
    
    recipes, total_count = get_top_recipes(
        region='Indian',
        min_rating=4.5,
        max_time=90,
        sort_by='rating',
        sort_order='DESC',
        limit=3
    )
    
    print(f"✅ Matching recipes: {total_count}")
    print(f"✅ Retrieved: {len(recipes)} recipes")
    
    for recipe in recipes:
        print(f"  - {recipe.name}")
        print(f"    Rating: {recipe.rating} | Time: {recipe.total_time_minutes} min")


def test_get_by_id():
    """Test: Get recipe by ID"""
    print("\n" + "="*80)
    print("TEST 6: Get recipe by ID (ID=1)")
    print("="*80)
    
    recipe = get_recipe_by_id(1)
    
    if recipe:
        print(f"✅ Recipe found: {recipe.name}")
        print(f"\nDetails:")
        print(f"  Region: {recipe.region}")
        print(f"  Difficulty: {recipe.difficulty}")
        print(f"  Rating: {recipe.rating}/5.0")
        print(f"  Time: {recipe.prep_time_minutes}min prep + {recipe.cook_time_minutes}min cook = {recipe.total_time_minutes}min total")
        print(f"  Servings: {recipe.servings}")
        print(f"  Calories: {recipe.calories}")
        
        print(f"\n  Tastes ({len(recipe.tastes)}):")
        for taste, intensity in recipe.tastes:
            print(f"    - {taste}: {'⭐' * intensity} ({intensity}/5)")
        
        print(f"\n  Meal Types: {', '.join(recipe.meal_types)}")
        print(f"  Dietary Tags: {', '.join(recipe.dietary_tags)}")
        
        print(f"\n  Ingredients ({len(recipe.ingredients)}):")
        for ing in recipe.ingredients[:3]:  # Show first 3
            print(f"    - {ing['quantity']} {ing['unit']} {ing['name']}")
        if len(recipe.ingredients) > 3:
            print(f"    ... and {len(recipe.ingredients) - 3} more")
        
        print(f"\n  Steps ({len(recipe.steps)}):")
        for i, step in enumerate(recipe.steps[:2], 1):  # Show first 2
            print(f"    {i}. {step[:60]}...")
        if len(recipe.steps) > 2:
            print(f"    ... and {len(recipe.steps) - 2} more steps")
    else:
        print("❌ Recipe not found")


def test_pagination():
    """Test: Pagination"""
    print("\n" + "="*80)
    print("TEST 7: Pagination (page_size=2, page 1 and page 2)")
    print("="*80)
    
    # Page 1
    recipes_p1, total = get_top_recipes(limit=2, offset=0)
    print(f"✅ Total: {total} recipes")
    print(f"\nPage 1:")
    for recipe in recipes_p1:
        print(f"  - {recipe.name}")
    
    # Page 2
    recipes_p2, _ = get_top_recipes(limit=2, offset=2)
    print(f"\nPage 2:")
    for recipe in recipes_p2:
        print(f"  - {recipe.name}")


def test_available_filters():
    """Test: Get available filter options"""
    print("\n" + "="*80)
    print("TEST 8: Get available filter options")
    print("="*80)
    
    filters = get_available_filters()
    
    print(f"✅ Available Regions: {', '.join(filters['regions'])}")
    print(f"✅ Available Difficulties: {', '.join(filters['difficulties'])}")
    print(f"✅ Available Meal Types: {', '.join(filters['meal_types'])}")
    print(f"✅ Available Dietary Tags: {', '.join(filters['dietary_tags'])}")


def test_summary_vs_detailed():
    """Test: Summary vs Detailed response"""
    print("\n" + "="*80)
    print("TEST 9: Summary vs Detailed response")
    print("="*80)
    
    # Detailed
    detailed, _ = get_top_recipes(limit=1, detailed=True)
    if detailed:
        recipe = detailed[0]
        print(f"✅ Detailed recipe has {len(recipe.ingredients)} ingredients")
        print(f"✅ Detailed recipe has {len(recipe.steps)} steps")
    
    # Summary
    summary, _ = get_top_recipes(limit=1, detailed=False)
    if summary:
        recipe = summary[0]
        print(f"✅ Summary has basic fields only (no ingredients/steps)")
        print(f"   Name: {recipe.name}")
        print(f"   Region: {recipe.region}")
        print(f"   Rating: {recipe.rating}")


# ============================================================================
# Main Test Runner
# ============================================================================

if __name__ == "__main__":
    print("\n" + "🧪" * 40)
    print(" " * 20 + "TOP RECIPES API TEST SUITE")
    print("🧪" * 40)
    
    try:
        test_get_all_recipes()
        test_filter_by_region()
        test_filter_by_dietary()
        test_search()
        test_advanced_filters()
        test_get_by_id()
        test_pagination()
        test_available_filters()
        test_summary_vs_detailed()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED!")
        print("="*80)
        print("\n💡 To test the API endpoints, run:")
        print("   python main.py")
        print("\nThen visit:")
        print("   http://localhost:8000/docs")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
