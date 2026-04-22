-- V16__fix_baking_categories.sql
-- Correct miscategorized baking recipes

UPDATE recipes 
SET category = 'BAKING' 
WHERE category = 'VEG' 
AND (
    title ILIKE '%Bread%' 
    OR title ILIKE '%Sourdough%' 
    OR title ILIKE '%Cake%' 
    OR title ILIKE '%Cookie%'
    OR title ILIKE '%Pastry%'
    OR title ILIKE '%Muffin%'
    OR title ILIKE '%Brownie%'
    OR title ILIKE '%Pie%'
    OR title ILIKE '%Tart%'
    OR title ILIKE '%Bake%'
    OR title ILIKE '%Bagel%'
);

-- Fix Pancakes (Categorize as BREAKFAST)
UPDATE recipes 
SET category = 'BREAKFAST' 
WHERE category = 'VEG' 
AND (
    title ILIKE '%Pancake%' 
    OR title ILIKE '%Waffle%' 
    OR title ILIKE '%Omelet%' 
    OR title ILIKE '%French Toast%'
);
