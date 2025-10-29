-- ============================================================================
-- Supabase Top Recipes Table Schema
-- ============================================================================
-- This SQL script creates the top_recipes table in Supabase PostgreSQL
-- Replaces the local SQLite database with cloud-based storage
-- Date: October 29, 2025
-- ============================================================================

-- Drop existing table if it exists (be careful in production!)
DROP TABLE IF EXISTS top_recipes CASCADE;

-- Create the top_recipes table
CREATE TABLE top_recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    region VARCHAR(100),
    
    -- Tastes stored as JSONB: [{"name": "Spicy", "intensity": 4}, ...]
    tastes JSONB DEFAULT '[]'::jsonb,
    
    -- Arrays for meal types and dietary tags
    meal_types TEXT[] DEFAULT '{}',
    dietary_tags TEXT[] DEFAULT '{}',
    
    -- Recipe metadata
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    total_time_minutes INTEGER,
    servings INTEGER,
    calories INTEGER,
    
    -- Ingredients stored as JSONB array
    -- [{"quantity": "750", "unit": "grams", "name": "Chicken", "preparation": "cut into pieces"}, ...]
    ingredients JSONB DEFAULT '[]'::jsonb,
    
    -- Steps stored as text array
    steps TEXT[] DEFAULT '{}',
    
    -- Images
    image_url TEXT,
    step_image_urls TEXT[] DEFAULT '{}',
    
    -- Ratings and scores
    popularity_score DECIMAL(5,2) DEFAULT 0.0,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    
    -- Source tracking
    source VARCHAR(50) DEFAULT 'gemini',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_top_recipes_region ON top_recipes(region);
CREATE INDEX idx_top_recipes_difficulty ON top_recipes(difficulty);
CREATE INDEX idx_top_recipes_rating ON top_recipes(rating DESC);
CREATE INDEX idx_top_recipes_popularity ON top_recipes(popularity_score DESC);
CREATE INDEX idx_top_recipes_total_time ON top_recipes(total_time_minutes);
CREATE INDEX idx_top_recipes_meal_types ON top_recipes USING GIN(meal_types);
CREATE INDEX idx_top_recipes_dietary_tags ON top_recipes USING GIN(dietary_tags);
CREATE INDEX idx_top_recipes_tastes ON top_recipes USING GIN(tastes);
CREATE INDEX idx_top_recipes_name_search ON top_recipes USING GIN(to_tsvector('english', name));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_top_recipes_updated_at
    BEFORE UPDATE ON top_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE top_recipes IS 'Curated top recipes from various cuisines with detailed cooking instructions';

-- Add comments to important columns
COMMENT ON COLUMN top_recipes.tastes IS 'JSONB array of taste profiles with intensity: [{"name": "Spicy", "intensity": 4}]';
COMMENT ON COLUMN top_recipes.ingredients IS 'JSONB array of ingredients: [{"quantity": "2", "unit": "cups", "name": "Rice", "preparation": "washed"}]';
COMMENT ON COLUMN top_recipes.steps IS 'Array of cooking step instructions';
COMMENT ON COLUMN top_recipes.step_image_urls IS 'Array of image URLs for each step (empty string if no image)';

-- Grant permissions (adjust based on your Supabase setup)
-- If using RLS (Row Level Security), add policies as needed

GRANT SELECT, INSERT, UPDATE, DELETE ON top_recipes TO authenticated;
GRANT SELECT ON top_recipes TO anon;
GRANT USAGE, SELECT ON SEQUENCE top_recipes_id_seq TO authenticated;

-- ============================================================================
-- Example Insert (for testing)
-- ============================================================================
-- This can be removed after testing

INSERT INTO top_recipes (
    name, description, region, tastes, meal_types, dietary_tags,
    difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
    servings, calories, ingredients, steps, image_url, step_image_urls,
    rating, popularity_score, source
) VALUES (
    'Butter Chicken Test',
    'Classic North Indian curry with tender chicken in a rich tomato-butter sauce',
    'Indian',
    '[{"name": "Spicy", "intensity": 4}, {"name": "Savory", "intensity": 5}, {"name": "Rich", "intensity": 4}]'::jsonb,
    ARRAY['Lunch', 'Dinner'],
    ARRAY['Non-Vegetarian', 'Gluten-Free'],
    'Medium',
    30,
    45,
    75,
    4,
    450,
    '[
        {"quantity": "750", "unit": "grams", "name": "Chicken", "preparation": "cut into pieces"},
        {"quantity": "200", "unit": "grams", "name": "Butter", "preparation": ""},
        {"quantity": "1", "unit": "cup", "name": "Heavy Cream", "preparation": ""}
    ]'::jsonb,
    ARRAY[
        'Marinate chicken with yogurt and spices for 30 minutes',
        'Cook marinated chicken in a pan until golden brown',
        'Prepare tomato-butter sauce with onions, tomatoes, and spices',
        'Add cooked chicken to the sauce and simmer',
        'Finish with cream and kasuri methi'
    ],
    'https://example.com/butter-chicken.jpg',
    ARRAY['', '', '', '', ''],
    4.7,
    95.0,
    'test'
);

-- Verify the insert
SELECT id, name, region, difficulty, rating FROM top_recipes WHERE source = 'test';
