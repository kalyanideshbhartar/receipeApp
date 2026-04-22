-- V27__create_audit_logs_and_categories.sql

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Tags table
CREATE TABLE IF NOT EXISTS tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(100)
);

-- Create Recipe-Tags join table
CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id BIGINT NOT NULL REFERENCES recipes(id),
    tag_id BIGINT NOT NULL REFERENCES tags(id),
    PRIMARY KEY (recipe_id, tag_id)
);

-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_type VARCHAR(255) NOT NULL,
    target_user_id BIGINT,
    performed_by_id BIGINT REFERENCES users(id),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create category_id column in recipes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='category_id') THEN
        ALTER TABLE recipes ADD COLUMN category_id BIGINT REFERENCES categories(id);
    END IF;
END $$;

-- Migrate existing recipe categories
-- 1. Insert unique categories from recipes into categories table
INSERT INTO categories (name)
SELECT DISTINCT category FROM recipes
WHERE category IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- 2. Update recipes.category_id based on matching name
UPDATE recipes r
SET category_id = c.id
FROM categories c
WHERE r.category = c.name;

-- 3. We'll keep the 'category' column for a moment during migration, then drop it
-- (Usually better to do in a separate migration if high traffic, but for this dev stage it's fine)
-- ALTER TABLE recipes DROP COLUMN category;
