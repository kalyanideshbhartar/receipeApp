-- V11__add_smart_features.sql

-- Add nutrition columns to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS protein DOUBLE PRECISION;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS carbs DOUBLE PRECISION;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fats DOUBLE PRECISION;

-- Add category to ingredients
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'OTHER';

-- Add status and servings adjustment to meal plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PLANNED';
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS servings_adjustment INTEGER DEFAULT 0;

-- Add recipe linking to shopping list items
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL;
