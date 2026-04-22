-- V1__init_schema.sql
-- Flyway Migration: Initial schema creation for Social Recipe App

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL PRIMARY KEY,
    username            VARCHAR(100) NOT NULL UNIQUE,
    email               VARCHAR(100) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    bio                 VARCHAR(500),
    profile_picture_url VARCHAR(500),
    follower_count      INTEGER NOT NULL DEFAULT 0,
    following_count     INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role     VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- ─── Follows ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_follows (
    id           BIGSERIAL PRIMARY KEY,
    follower_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);

-- ─── Recipes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    description        VARCHAR(2000),
    image_url          VARCHAR(500),
    prep_time_minutes  INTEGER,
    cook_time_minutes  INTEGER,
    servings           INTEGER,
    like_count         INTEGER NOT NULL DEFAULT 0,
    comment_count      INTEGER NOT NULL DEFAULT 0,
    author_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

-- ─── Ingredients ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    quantity  VARCHAR(50)  NOT NULL,
    unit      VARCHAR(50),
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

-- GIN index on ingredients name for performant full-text search
CREATE INDEX IF NOT EXISTS idx_ingredients_name_gin ON ingredients USING GIN (to_tsvector('english', name));

-- ─── Steps ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS steps (
    id           BIGSERIAL PRIMARY KEY,
    step_number  INTEGER      NOT NULL,
    instruction  VARCHAR(1000) NOT NULL,
    recipe_id    BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

-- ─── Likes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id  BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, recipe_id)
);

-- ─── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id         BIGSERIAL PRIMARY KEY,
    content    VARCHAR(1000) NOT NULL,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id  BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_likes_recipe_id ON likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON user_follows(following_id);
