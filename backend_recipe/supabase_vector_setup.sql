-- Supabase Vector Store Setup for Recipe Recommender
-- Run this in your Supabase SQL Editor

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- The langchain_pg_embedding and langchain_pg_collection tables 
-- will be created automatically by langchain-postgres when you first run the app.
-- 
-- However, if you want to manually create them or verify the schema:

-- Collection table (stores metadata about vector collections)
CREATE TABLE IF NOT EXISTS langchain_pg_collection (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    cmetadata JSONB
);

-- Embedding table (stores the actual vectors and documents)
CREATE TABLE IF NOT EXISTS langchain_pg_embedding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES langchain_pg_collection(uuid) ON DELETE CASCADE,
    embedding vector,
    document TEXT,
    cmetadata JSONB,
    custom_id VARCHAR
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_embedding_collection 
    ON langchain_pg_embedding(collection_id);

CREATE INDEX IF NOT EXISTS idx_embedding_custom_id 
    ON langchain_pg_embedding(custom_id);

-- Create index for vector similarity search using cosine distance
CREATE INDEX IF NOT EXISTS idx_embedding_vector_cosine 
    ON langchain_pg_embedding 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Optional: Create index for L2 distance (Euclidean)
-- CREATE INDEX IF NOT EXISTS idx_embedding_vector_l2 
--     ON langchain_pg_embedding 
--     USING ivfflat (embedding vector_l2_ops)
--     WITH (lists = 100);

-- Grant necessary permissions (adjust if needed for your setup)
-- These are usually already set in Supabase, but just in case:
ALTER TABLE langchain_pg_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE langchain_pg_embedding ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role access (the backend will use service role)
CREATE POLICY IF NOT EXISTS "Allow service role full access to collections"
    ON langchain_pg_collection
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow service role full access to embeddings"
    ON langchain_pg_embedding
    FOR ALL
    TO service_role
    USING (true);

-- Optional: View to check collection statistics
CREATE OR REPLACE VIEW recipe_collection_stats AS
SELECT 
    c.name as collection_name,
    COUNT(e.id) as document_count,
    COUNT(DISTINCT e.cmetadata->>'source') as unique_sources
FROM langchain_pg_collection c
LEFT JOIN langchain_pg_embedding e ON c.uuid = e.collection_id
GROUP BY c.name;

-- Query to view what PDFs are currently stored
-- SELECT DISTINCT cmetadata->>'source' as pdf_source
-- FROM langchain_pg_embedding
-- WHERE collection_id = (SELECT uuid FROM langchain_pg_collection WHERE name = 'recipe_embeddings');
