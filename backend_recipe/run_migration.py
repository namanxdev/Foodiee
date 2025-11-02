#!/usr/bin/env python3
"""
Run database migration to add regeneration fields
"""
import os
import sys
import psycopg
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    supabase_url = os.environ.get('SUPABASE_OG_URL')
    if not supabase_url:
        print("❌ Error: SUPABASE_OG_URL not found in environment")
        sys.exit(1)
    
    migration_file = 'database/migrations/add_regeneration_fields.sql'
    
    try:
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print(f"🔄 Running migration from {migration_file}...")
        
        conn = psycopg.connect(supabase_url)
        cursor = conn.cursor()
        cursor.execute(migration_sql)
        conn.commit()
        conn.close()
        
        print('✅ Migration completed successfully!')
        print('📋 Added columns:')
        print('   - steps_beginner (JSONB)')
        print('   - steps_advanced (JSONB)')
        print('   - steps_beginner_images (JSONB)')
        print('   - steps_advanced_images (JSONB)')
        print('   - ingredient_image_urls (JSONB)')
        print('   - validation_status (VARCHAR)')
        print('   - data_quality_score (INTEGER)')
        print('   - is_complete (BOOLEAN)')
        print('   - last_validated_at (TIMESTAMP)')
        
    except FileNotFoundError:
        print(f"❌ Error: Migration file not found: {migration_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        sys.exit(1)

if __name__ == '__main__':
    run_migration()
