-- V14__update_invalid_avatars.sql
-- Fix existing users who have the broken Cloudinary default avatar URL
UPDATE users 
SET profile_picture_url = 'https://ui-avatars.com/api/?name=' || REPLACE(username, ' ', '+') || '&background=random'
WHERE profile_picture_url = 'https://res.cloudinary.com/dnd2b1vhj/image/upload/v1710586000/profiles/default_avatar.png'
   OR profile_picture_url IS NULL 
   OR profile_picture_url = '';

-- Also fix broken cover pictures
UPDATE users
SET cover_picture_url = 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80'
WHERE cover_picture_url = 'https://res.cloudinary.com/dnd2b1vhj/image/upload/v1710586000/covers/default_cover.jpg'
   OR cover_picture_url IS NULL 
   OR cover_picture_url = '';
