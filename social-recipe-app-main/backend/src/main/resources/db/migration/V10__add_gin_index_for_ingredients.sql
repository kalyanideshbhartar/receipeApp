-- Add GIN index for high-speed full-text search on ingredients
-- This enables efficient to_tsvector searches on ingredient names as required by Project 08

CREATE INDEX IF NOT EXISTS idx_ingredients_name_gin ON ingredients USING GIN (to_tsvector('english', name));
