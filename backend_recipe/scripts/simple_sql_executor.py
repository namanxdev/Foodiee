#!/usr/bin/env python3
"""
Simple SQL Executor for Supabase
=================================
Uses psycopg to execute SQL file with proper statement splitting
"""

import os
import sys
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

def split_sql_statements(sql_content):
    """Split SQL content into statements, handling dollar-quoted strings"""
    statements = []
    current = ""
    in_dollar_quote = False
    dollar_tag = None
    
    i = 0
    while i < len(sql_content):
        char = sql_content[i]
        
        # Check for dollar quote start/end
        if char == '$' and not in_dollar_quote:
            # Look ahead for dollar quote pattern
            j = i
            tag = ""
            while j < len(sql_content) and sql_content[j] != '$':
                tag += sql_content[j]
                j += 1
            if j < len(sql_content):
                tag += '$'
                j += 1
                # Check if this is a complete dollar tag
                if tag.endswith('$'):
                    dollar_tag = tag
                    in_dollar_quote = True
                    current += sql_content[i:j]
                    i = j
                    continue
        
        elif in_dollar_quote and current.endswith(dollar_tag):
            in_dollar_quote = False
            dollar_tag = None
        
        current += char
        
        # If we see a semicolon outside of dollar quotes, it's a statement end
        if char == ';' and not in_dollar_quote:
            stmt = current.strip()
            if stmt and not stmt.startswith('--'):
                statements.append(stmt)
            current = ""
        
        i += 1
    
    # Add remaining content if any
    if current.strip() and not current.strip().startswith('--'):
        statements.append(current.strip())
    
    return statements


def execute_sql_file(conn, sql_content):
    """Execute SQL file content"""
    statements = split_sql_statements(sql_content)
    
    print(f"Executing {len(statements)} SQL statements...")
    
    success_count = 0
    error_count = 0
    
    with conn.cursor() as cursor:
        for i, stmt in enumerate(statements, 1):
            try:
                if not stmt.strip():
                    continue
                
                # Skip SELECT statements that are just informational
                if stmt.strip().upper().startswith('SELECT') and 'status' in stmt.lower():
                    try:
                        cursor.execute(stmt)
                        result = cursor.fetchone()
                        if result:
                            print(f"✅ Statement {i}: {result}")
                    except:
                        pass
                    continue
                
                cursor.execute(stmt)
                success_count += 1
                
                # Print progress for important statements
                stmt_upper = stmt[:50].upper()
                if any(stmt_upper.startswith(cmd) for cmd in ['CREATE', 'DROP', 'ALTER', 'INSERT']):
                    print(f"✅ Statement {i}: {stmt[:60]}...")
                
            except Exception as e:
                error_msg = str(e)
                # Some errors are expected
                if 'already exists' in error_msg.lower() or 'does not exist' in error_msg.lower():
                    print(f"⚠️  Statement {i}: {error_msg[:80]}")
                    success_count += 1  # Count as success since it's expected
                else:
                    print(f"❌ Statement {i} failed: {error_msg[:100]}")
                    error_count += 1
        
        conn.commit()
    
    print(f"\n✅ Executed {success_count} statements, {error_count} errors")
    return success_count > 0


def verify_schema(conn):
    """Verify schema was created correctly"""
    print("\nVerifying schema...")
    
    checks = []
    
    with conn.cursor(row_factory=dict_row) as cursor:
        # Check columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name IN ('chat_history', 'image_urls')
        """)
        cols = cursor.fetchall()
        if len(cols) >= 2:
            print("✅ user_sessions columns exist")
            checks.append(True)
        else:
            print(f"❌ Missing columns (found {len(cols)}/2)")
            checks.append(False)
        
        # Check users columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('image_generation_last_date', 'image_generation_count_today')
        """)
        cols = cursor.fetchall()
        if len(cols) >= 2:
            print("✅ users columns exist")
            checks.append(True)
        else:
            print(f"❌ Missing users columns (found {len(cols)}/2)")
            checks.append(False)
        
        # Check admin_config
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'admin_config'
        """)
        if cursor.fetchone():
            print("✅ admin_config table exists")
            checks.append(True)
        else:
            print("❌ admin_config table missing")
            checks.append(False)
        
        # Check functions
        cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_name IN (
                'check_image_generation_limit',
                'increment_image_generation_count',
                'get_user_session_history',
                'get_user_session_count'
            )
        """)
        funcs = cursor.fetchall()
        if len(funcs) >= 4:
            print(f"✅ All {len(funcs)} functions exist")
            checks.append(True)
        else:
            print(f"❌ Missing functions (found {len(funcs)}/4)")
            checks.append(False)
    
    return all(checks)


def main():
    supabase_url = os.getenv("SUPABASE_OG_URL")
    if not supabase_url:
        print("❌ SUPABASE_OG_URL not found")
        sys.exit(1)
    
    print("Connecting to Supabase...")
    conn = psycopg.connect(supabase_url)
    print("✅ Connected\n")
    
    # Read SQL file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, "..", "database", "push_to_supabase.sql")
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    print(f"Reading SQL file: {sql_file}")
    
    # Execute
    if execute_sql_file(conn, sql_content):
        if verify_schema(conn):
            print("\n✅ Schema push completed successfully!")
        else:
            print("\n⚠️  Schema verification had issues")
    else:
        print("\n❌ Schema push failed")
        sys.exit(1)
    
    conn.close()


if __name__ == "__main__":
    main()

