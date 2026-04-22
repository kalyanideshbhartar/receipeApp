-- V15__fix_seafood_categories.sql
-- Correct miscategorized seafood recipes

UPDATE recipes 
SET category = 'SEAFOOD' 
WHERE category = 'VEG' 
AND (
    title ILIKE '%Salmon%' 
    OR title ILIKE '%Scallops%' 
    OR title ILIKE '%Sea Bass%' 
    OR title ILIKE '%Branzino%'
    OR title ILIKE '%Shrimp%'
    OR title ILIKE '%Prawn%'
    OR title ILIKE '%Tuna%'
    OR title ILIKE '%Cod%'
    OR title ILIKE '%Lobster%'
    OR title ILIKE '%Crab%'
    OR title ILIKE '%Mackerel%'
    OR title ILIKE '%Sardine%'
);

-- Fix the null category for ID 1 (Mediterranean Quinoa Salad) while we are at it
UPDATE recipes 
SET category = 'HEALTHY' 
WHERE id = 1 AND category IS NULL;
