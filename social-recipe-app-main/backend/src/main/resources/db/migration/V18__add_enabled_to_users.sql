-- Add enabled column to users table for email verification
ALTER TABLE users ADD COLUMN enabled BOOLEAN DEFAULT FALSE;

-- Enable existing users (if any) or set them to false based on preference
UPDATE users SET enabled = TRUE;
