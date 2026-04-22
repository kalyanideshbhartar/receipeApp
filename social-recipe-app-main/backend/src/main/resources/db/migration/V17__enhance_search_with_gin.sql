-- Add GIN index for full-text search on titles and descriptions
-- This complements V10 (ingredients GIN index) to provide a complete search optimization

CREATE INDEX IF NOT EXISTS idx_recipes_title_gin ON recipes USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description_gin ON recipes USING GIN (to_tsvector('english', description));
