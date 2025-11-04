"""
Run Recipe Regeneration Database Setup
======================================
Execute SQL migration for recipe admin system
"""

import psycopg
from psycopg.rows import dict_row
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Execute the SQL migration"""
    supabase_url = os.environ.get("SUPABASE_OG_URL")
    
    if not supabase_url:
        print("❌ SUPABASE_OG_URL not found in environment variables")
        return False
    
    # Read SQL file
    sql_file = "supabase_recipe_regeneration_setup.sql"
    
    print(f"📖 Reading SQL file: {sql_file}")
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    print(f"🔗 Connecting to Supabase...")
    conn = psycopg.connect(supabase_url, row_factory=dict_row)
    
    try:
        print(f"🚀 Executing SQL migration...")
        with conn.cursor() as cur:
            # Execute the entire SQL content
            cur.execute(sql_content)
            conn.commit()
        
        print(f"✅ Migration completed successfully!")
        
        # Verify tables were created
        print(f"\n🔍 Verifying tables...")
        with conn.cursor() as cur:
            # Check recipe_regeneration_jobs table
            cur.execute("""
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_name = 'recipe_regeneration_jobs'
            """)
            jobs_table_exists = cur.fetchone()['count'] > 0
            
            # Check recipe_regeneration_logs table
            cur.execute("""
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_name = 'recipe_regeneration_logs'
            """)
            logs_table_exists = cur.fetchone()['count'] > 0
            
            # Check top_recipes columns
            cur.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'top_recipes'
                AND column_name IN ('ingredients_image', 'steps_beginner', 'steps_advanced', 'validation_status')
            """)
            new_columns = [row['column_name'] for row in cur.fetchall()]
        
        print(f"✅ recipe_regeneration_jobs table: {'EXISTS' if jobs_table_exists else 'NOT FOUND'}")
        print(f"✅ recipe_regeneration_logs table: {'EXISTS' if logs_table_exists else 'NOT FOUND'}")
        print(f"✅ New columns in top_recipes: {', '.join(new_columns) if new_columns else 'NONE'}")
        
        # Test utility functions
        print(f"\n🧪 Testing utility functions...")
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM get_incomplete_recipes_count()")
            stats = cur.fetchone()
            print(f"✅ get_incomplete_recipes_count() works!")
            print(f"   - Missing main images: {stats['missing_main_image']}")
            print(f"   - Missing ingredients images: {stats['missing_ingredients_image']}")
            print(f"   - Missing steps images: {stats['missing_steps_images']}")
            print(f"   - Missing steps text: {stats['missing_steps_text']}")
            print(f"   - Total incomplete: {stats['total_incomplete']}")
        
        print(f"\n✅ All verifications passed!")
        return True
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    
    finally:
        conn.close()
        print(f"🔌 Database connection closed")

if __name__ == "__main__":
    print("="*60)
    print("Recipe Regeneration Database Setup")
    print("="*60)
    print()
    
    success = run_migration()
    
    if success:
        print()
        print("="*60)
        print("✅ Migration completed successfully!")
        print("="*60)
        print()
        print("Next steps:")
        print("1. Restart backend: python3 main.py")
        print("2. Test API endpoints at: http://localhost:8000/api/recipe-admin/")
        print("3. Check statistics: http://localhost:8000/api/recipe-admin/statistics")
    else:
        print()
        print("="*60)
        print("❌ Migration failed!")
        print("="*60)
