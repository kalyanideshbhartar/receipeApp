-- V12__add_healthy_recipe.sql
-- Add a sample healthy recipe to the database

-- Insert the recipe
INSERT INTO recipes (title, description, image_url, prep_time_minutes, cook_time_minutes, servings, author_id, created_at, updated_at)
SELECT 
    'Mediterranean Quinoa Salad', 
    'A refreshing and nutrient-dense salad with quinoa, fresh vegetables, and a lemon-herb dressing. Perfect for a healthy lunch or side dish.', 
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop', 
    15, 10, 4, 
    id, NOW(), NOW()
FROM users 
WHERE username = 'Akriti jha'
LIMIT 1;

-- Insert ingredients for the new recipe
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Quinoa', '1', 'cup', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Cucumber', '1', 'large', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Cherry Tomatoes', '1', 'cup', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Red Onion', '0.25', 'small', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Parsley', '0.5', 'cup', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Lemon', '1', 'juice', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Olive Oil', '3', 'tbsp', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO ingredients (name, quantity, unit, recipe_id)
SELECT 'Feta Cheese', '0.25', 'cup', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;

-- Insert steps for the new recipe
INSERT INTO steps (step_number, instruction, recipe_id)
SELECT 1, 'Rinse quinoa and cook in 2 cups of water until fluffy. Let cool.', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO steps (step_number, instruction, recipe_id)
SELECT 2, 'Finely chop cucumber, halve cherry tomatoes, and thinly slice red onion.', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO steps (step_number, instruction, recipe_id)
SELECT 3, 'In a large bowl, combine cooled quinoa, chopped vegetables, and parsley.', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO steps (step_number, instruction, recipe_id)
SELECT 4, 'Whisk together lemon juice and olive oil. Pour over salad.', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
INSERT INTO steps (step_number, instruction, recipe_id)
SELECT 5, 'Toss well to combine and sprinkle with crumbled feta cheese before serving.', id FROM recipes WHERE title = 'Mediterranean Quinoa Salad' LIMIT 1;
