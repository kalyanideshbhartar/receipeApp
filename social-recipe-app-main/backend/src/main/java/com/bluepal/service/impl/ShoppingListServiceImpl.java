package com.bluepal.service.impl;

import com.bluepal.entity.*;
import com.bluepal.repository.MealPlanRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.repository.ShoppingListItemRepository;
import com.bluepal.service.interfaces.ShoppingListService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import com.bluepal.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class ShoppingListServiceImpl implements ShoppingListService {

    private final ShoppingListItemRepository shoppingListItemRepository;
    private final RecipeRepository recipeRepository;
    private final MealPlanRepository mealPlanRepository;

    @Override
    @Transactional
    public ShoppingListItem addItem(User user, String name, String quantity, String unit, Recipe recipe) {
        return shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(user, name, unit, false)
                .map(existing -> {
                    existing.setQuantity(mergeQuantities(existing.getQuantity(), quantity));
                    // If it was manual and now linked to a recipe, or vice-versa, we keep the existing or update?
                    // Typically, aggregation means its for multiple things.
                    return shoppingListItemRepository.save(existing);
                })
                .orElseGet(() -> {
                    ShoppingListItem item = ShoppingListItem.builder()
                            .user(user)
                            .recipe(recipe)
                            .name(name)
                            .quantity(quantity)
                            .unit(unit)
                            .category(mapToCategory(name))
                            .purchased(false)
                            .build();
                    return shoppingListItemRepository.save(item);
                });
    }

    @Override
    public List<ShoppingListItem> getItems(User user) {
        return shoppingListItemRepository.findByUserOrderByCategoryAsc(user);
    }

    @Override
    @Transactional
    public ShoppingListItem togglePurchased(Long id, User user) {
        ShoppingListItem item = shoppingListItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShoppingListItem", "id", id));
        
        if (!item.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to toggle this item");
        }
        
        item.setPurchased(!item.isPurchased());
        return shoppingListItemRepository.save(item);
    }

    @Override
    @Transactional
    public void deleteCheckedItems(User user) {
        shoppingListItemRepository.deleteByUserAndPurchased(user, true);
    }

    @Override
    @Transactional
    public void addIngredientsFromRecipe(Long recipeId, User user) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", "id", recipeId));
        
        for (Ingredient ingredient : recipe.getIngredients()) {
            addItem(user, ingredient.getName(), ingredient.getQuantity(), ingredient.getUnit(), recipe);
        }
    }

    @Override
    @Transactional
    public void addIngredientsFromMealPlan(User user, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        List<com.bluepal.entity.MealPlan> plans = mealPlanRepository.findByUserAndPlannedDateBetween(user, startDate, endDate);
        for (com.bluepal.entity.MealPlan plan : plans) {
            addIngredientsFromRecipe(plan.getRecipe().getId(), user);
        }
    }

    private String mergeQuantities(String oldQty, String newQty) {
        if (oldQty == null) return newQty;
        if (newQty == null) return oldQty;
        try {
            double oldVal = Double.parseDouble(oldQty);
            double newVal = Double.parseDouble(newQty);
            double total = oldVal + newVal;
            if (total == (long) total) return String.format("%d", (long) total);
            return String.format("%.2f", total);
        } catch (Exception e) {
            return oldQty + " + " + newQty;
        }
    }

    private com.bluepal.entity.ShoppingCategory mapToCategory(String name) {
        String n = name.toLowerCase();
        if (n.contains("onion") || n.contains("garlic") || n.contains("tomato") || n.contains("potato") || n.contains("carrot") || n.contains("spinach")) return com.bluepal.entity.ShoppingCategory.VEGETABLES;
        if (n.contains("milk") || n.contains("cheese") || n.contains("yogurt") || n.contains("butter") || n.contains("cream")) return com.bluepal.entity.ShoppingCategory.DAIRY;
        if (n.contains("chicken") || n.contains("beef") || n.contains("pork") || n.contains("mutton") || n.contains("meat")) return com.bluepal.entity.ShoppingCategory.MEAT;
        if (n.contains("fish") || n.contains("shrimp") || n.contains("prawn") || n.contains("salmon")) return com.bluepal.entity.ShoppingCategory.SEAFOOD;
        if (n.contains("salt") || n.contains("pepper") || n.contains("cinnamon") || n.contains("turmeric") || n.contains("chili") || n.contains("spice")) return com.bluepal.entity.ShoppingCategory.SPICES;
        if (n.contains("rice") || n.contains("flour") || n.contains("pasta") || n.contains("bread") || n.contains("grain")) return com.bluepal.entity.ShoppingCategory.GRAINS;
        if (n.contains("apple") || n.contains("banana") || n.contains("orange") || n.contains("fruit") || n.contains("lemon")) return com.bluepal.entity.ShoppingCategory.FRUITS;
        return com.bluepal.entity.ShoppingCategory.OTHER;
    }
}
