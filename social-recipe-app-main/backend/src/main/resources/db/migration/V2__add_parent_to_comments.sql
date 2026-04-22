-- V2__add_parent_to_comments.sql
ALTER TABLE comments ADD COLUMN parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
