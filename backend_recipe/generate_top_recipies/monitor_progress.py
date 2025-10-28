#!/usr/bin/env python3
"""
Monitor the progress of recipe generation
"""
import sqlite3
import os
import time
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(BACKEND_DIR, "data", "top_recipes.db")

REGIONS = ["Indian", "Chinese", "Italian", "Mexican", "Japanese", "Mediterranean", "Thai", "Korean"]
TARGET_PER_REGION = 30

def get_recipe_counts():
    """Get current recipe counts by region."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    counts = {}
    for region in REGIONS:
        cursor.execute("""
            SELECT COUNT(DISTINCT r.id)
            FROM recipes r
            JOIN recipe_regions rr ON r.id = rr.recipe_id
            JOIN regions reg ON rr.region_id = reg.id
            WHERE reg.name = ?
        """, (region,))
        counts[region] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM recipes")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM ingredients")
    ingredients = cursor.fetchone()[0]
    
    conn.close()
    return counts, total, ingredients

def display_progress():
    """Display current progress."""
    counts, total, ingredients = get_recipe_counts()
    
    print("\n" + "="*60)
    print(f"📊 RECIPE GENERATION PROGRESS")
    print(f"⏰ Checked at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    for region in REGIONS:
        count = counts[region]
        percentage = (count / TARGET_PER_REGION) * 100
        status = "✅" if count >= TARGET_PER_REGION else "🔄" if count > 0 else "⏳"
        bar_length = int(percentage / 10)
        bar = "█" * bar_length + "░" * (10 - bar_length)
        print(f"{status} {region:15} : [{bar}] {count:2}/{TARGET_PER_REGION} ({percentage:5.1f}%)")
    
    total_target = len(REGIONS) * TARGET_PER_REGION
    overall_percentage = (total / total_target) * 100
    
    print("="*60)
    print(f"📦 Total Recipes: {total}/{total_target} ({overall_percentage:.1f}%)")
    print(f"🥘 Unique Ingredients: {ingredients}")
    print("="*60)

if __name__ == "__main__":
    display_progress()
