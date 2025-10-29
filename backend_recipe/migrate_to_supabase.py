"""
Migrate Top Recipes from SQLite to Supabase
============================================
This script transfers all recipes from the local SQLite database
to Supabase PostgreSQL.

Date: October 29, 2025
"""

import sqlite3
import json
import os
import sys
from typing import List, Dict, Optional, Tuple
import psycopg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Paths
SQLITE_DB_PATH = 'data/top_recipes/top_recipes_final.db'
STEP_DELIMITER = '<STEP_DELIMITER>'

def get_supabase_connection():
    """Get Supabase PostgreSQL connection"""
    supabase_url = os.environ.get("SUPABASE_OG_URL")
    if not supabase_url:
        raise ValueError("SUPABASE_OG_URL not found in environment variables")
    
    return psycopg.connect(supabase_url)


def deserialize_tastes_from_sqlite(tastes_str: Optional[str]) -> List[Dict]:
    """Parse tastes from SQLite format to PostgreSQL JSONB format"""
    if not tastes_str:
        return []
    
    # Handle JSON format (from migrated data)
    if tastes_str.strip().startswith('['):
        try:
            return json.loads(tastes_str)
        except:
            return []
    
    # Handle pipe-delimited format (from original test data)
    tastes = []
    for entry in tastes_str.split('|'):
        if ':' in entry:
            parts = entry.split(':', 1)
            if len(parts) == 2:
                name, intensity = parts
                try:
                    tastes.append({
                        "name": name.strip(),
                        "intensity": int(intensity.strip())
                    })
                except ValueError:
                    continue
    return tastes


def deserialize_list_from_sqlite(list_str: Optional[str]) -> List[str]:
    """Parse pipe-delimited string to list"""
    if not list_str:
        return []
    return [item.strip() for item in list_str.split('|') if item.strip()]


def deserialize_ingredients_from_sqlite(ingredients_str: Optional[str]) -> List[Dict]:
    """Parse ingredients from SQLite format to PostgreSQL JSONB format"""
    if not ingredients_str:
        return []
    
    # Handle JSON format (from migrated data)
    if ingredients_str.strip().startswith('['):
        try:
            ingredients_list = json.loads(ingredients_str)
            # Normalize key names
            return [{
                'quantity': ing.get('quantity', ''),
                'unit': ing.get('unit', ''),
                'name': ing.get('name', ''),
                'preparation': ing.get('preparation', ing.get('preparation_note', '')) or ''
            } for ing in ingredients_list]
        except:
            return []
    
    # Handle pipe-delimited format (from original test data)
    ingredients = []
    for line in ingredients_str.strip().split('\n'):
        if not line:
            continue
        parts = line.split('|')
        if len(parts) >= 3:
            ingredients.append({
                'quantity': parts[0].strip(),
                'unit': parts[1].strip(),
                'name': parts[2].strip(),
                'preparation': parts[3].strip() if len(parts) > 3 else ''
            })
    return ingredients


def deserialize_steps_from_sqlite(steps_str: Optional[str]) -> List[str]:
    """Parse steps from SQLite format to PostgreSQL array"""
    if not steps_str:
        return []
    return [step.strip() for step in steps_str.split(STEP_DELIMITER) if step.strip()]


def deserialize_step_images_from_sqlite(step_images_str: Optional[str]) -> List[str]:
    """Parse step images from SQLite format to PostgreSQL array"""
    if not step_images_str:
        return []
    return step_images_str.split(STEP_DELIMITER)


def migrate_recipes():
    """Migrate all recipes from SQLite to Supabase"""
    print("🚀 Starting migration from SQLite to Supabase...\n")
    
    # Connect to SQLite
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"❌ SQLite database not found: {SQLITE_DB_PATH}")
        return
    
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_cursor = sqlite_conn.cursor()
    
    # Get total count
    sqlite_cursor.execute("SELECT COUNT(*) FROM top_recipes")
    total_count = sqlite_cursor.fetchone()[0]
    print(f"📊 Found {total_count} recipes in SQLite database")
    
    # Connect to Supabase
    try:
        supabase_conn = get_supabase_connection()
        supabase_cursor = supabase_conn.cursor()
        print("✅ Connected to Supabase\n")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sqlite_conn.close()
        return
    
    # Fetch all recipes from SQLite
    sqlite_cursor.execute("""
        SELECT id, name, description, region, tastes, meal_types, dietary_tags,
               difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
               servings, calories, ingredients, steps, image_url, step_image_urls,
               popularity_score, rating, source, created_at, updated_at
        FROM top_recipes
    """)
    
    rows = sqlite_cursor.fetchall()
    
    # Clear existing data in Supabase (optional - be careful!)
    print("⚠️  Clearing existing data from Supabase top_recipes table...")
    supabase_cursor.execute("DELETE FROM top_recipes WHERE source != 'test'")
    supabase_conn.commit()
    
    # Insert recipes into Supabase
    inserted_count = 0
    skipped_count = 0
    
    for row in rows:
        name = "Unknown"  # Default value
        try:
            (sqlite_id, name, description, region, tastes_str, meal_types_str, dietary_tags_str,
             difficulty, prep_time, cook_time, total_time, servings, calories,
             ingredients_str, steps_str, image_url, step_images_str,
             popularity_score, rating, source, created_at, updated_at) = row
            
            # Parse data
            tastes = deserialize_tastes_from_sqlite(tastes_str)
            meal_types = deserialize_list_from_sqlite(meal_types_str)
            dietary_tags = deserialize_list_from_sqlite(dietary_tags_str)
            ingredients = deserialize_ingredients_from_sqlite(ingredients_str)
            steps = deserialize_steps_from_sqlite(steps_str)
            step_images = deserialize_step_images_from_sqlite(step_images_str)
            
            # Ensure step_images matches steps length
            while len(step_images) < len(steps):
                step_images.append('')
            step_images = step_images[:len(steps)]
            
            # Insert into Supabase
            supabase_cursor.execute("""
                INSERT INTO top_recipes (
                    name, description, region, tastes, meal_types, dietary_tags,
                    difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
                    servings, calories, ingredients, steps, image_url, step_image_urls,
                    rating, popularity_score, source
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                name, description, region,
                json.dumps(tastes),  # JSONB
                meal_types,  # Array
                dietary_tags,  # Array
                difficulty, prep_time, cook_time, total_time, servings, calories,
                json.dumps(ingredients),  # JSONB
                steps,  # Array
                image_url,
                step_images,  # Array
                rating, popularity_score, source
            ))
            
            inserted_count += 1
            if inserted_count % 50 == 0:
                print(f"  ✓ Migrated {inserted_count}/{total_count} recipes...")
                
        except Exception as e:
            print(f"  ⚠️  Skipped recipe '{name}': {e}")
            skipped_count += 1
            continue
    
    # Commit changes
    supabase_conn.commit()
    
    # Close connections
    sqlite_conn.close()
    supabase_conn.close()
    
    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Migration Complete!")
    print(f"{'='*60}")
    print(f"  📥 Inserted: {inserted_count} recipes")
    print(f"  ⏭️  Skipped:  {skipped_count} recipes")
    print(f"{'='*60}\n")
    
    # Verify migration
    verify_migration()


def verify_migration():
    """Verify the migration was successful"""
    print("🔍 Verifying migration...\n")
    
    try:
        conn = get_supabase_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) FROM top_recipes WHERE source != 'test'")
        result = cursor.fetchone()
        total = result[0] if result else 0
        print(f"  📊 Total recipes in Supabase: {total}")
        
        # Get count by region
        cursor.execute("""
            SELECT region, COUNT(*) as count
            FROM top_recipes
            WHERE source != 'test'
            GROUP BY region
            ORDER BY count DESC
        """)
        
        print(f"\n  📍 Recipes by region:")
        for region, count in cursor.fetchall():
            print(f"     • {region}: {count}")
        
        # Get sample recipe
        cursor.execute("""
            SELECT id, name, region, difficulty, rating, array_length(steps, 1) as step_count
            FROM top_recipes
            WHERE source != 'test'
            LIMIT 3
        """)
        
        print(f"\n  📖 Sample recipes:")
        for recipe_id, name, region, difficulty, rating, step_count in cursor.fetchall():
            print(f"     • ID {recipe_id}: {name} ({region}, {difficulty}, {rating}⭐, {step_count} steps)")
        
        conn.close()
        print("\n✅ Verification complete!\n")
        
    except Exception as e:
        print(f"❌ Verification failed: {e}\n")


if __name__ == "__main__":
    migrate_recipes()
