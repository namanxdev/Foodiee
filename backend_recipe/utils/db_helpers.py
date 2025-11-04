"""
Database Helper Utilities
=========================
Centralized database connection and query helpers
"""

import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from typing import Optional
from contextlib import contextmanager

load_dotenv()


def get_supabase_url() -> str:
    """Get Supabase connection URL from environment"""
    supabase_url = os.environ.get("SUPABASE_OG_URL")
    if not supabase_url:
        raise ValueError("SUPABASE_OG_URL not found in environment variables")
    return supabase_url


@contextmanager
def get_db_connection(row_factory=dict_row):
    """
    Context manager for database connections
    Automatically handles connection closure
    
    Usage:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM recipes")
    """
    conn = None
    try:
        supabase_url = get_supabase_url()
        conn = psycopg.connect(supabase_url, row_factory=row_factory)
        yield conn
    finally:
        if conn and not conn.closed:
            conn.close()


def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False):
    """
    Execute a database query with automatic connection management
    
    Args:
        query: SQL query string
        params: Query parameters
        fetch_one: Return single row
        fetch_all: Return all rows
    
    Returns:
        Query result or None
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            
            if fetch_one:
                return cur.fetchone()
            elif fetch_all:
                return cur.fetchall()
            
            conn.commit()
            return None


def insert_and_return_id(table: str, data: dict) -> Optional[int]:
    """
    Insert a row and return its ID
    
    Args:
        table: Table name
        data: Dictionary of column: value pairs
    
    Returns:
        Inserted row ID
    """
    columns = ', '.join(data.keys())
    placeholders = ', '.join(['%s'] * len(data))
    query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING id"
    
    result = execute_query(query, tuple(data.values()), fetch_one=True)
    return result['id'] if result else None

