-- V4__seed_default_user.sql
INSERT INTO users (username, email, password, bio, profile_picture_url, cover_picture_url)
VALUES ('Akriti jha', 'akriti@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DM9M/B8fQY0C', 'Culinary enthusiast & Social Recipe App explorer!', 'https://ui-avatars.com/api/?name=Akriti+Jha&background=random', 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80')
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'ROLE_USER' FROM users WHERE username = 'Akriti jha'
ON CONFLICT DO NOTHING;
