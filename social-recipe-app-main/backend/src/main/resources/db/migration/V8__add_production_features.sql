-- Add production-ready features: Categorization, Ratings, and Bookmarks

-- 1. Update recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS average_rating DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 2. Update shopping_list_items table
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'OTHER';

-- 3. Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    recipe_id BIGINT NOT NULL REFERENCES recipes(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- 4. Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    recipe_id BIGINT NOT NULL REFERENCES recipes(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);
