package com.bluepal.service.interfaces;

import com.bluepal.entity.Recipe;
import com.bluepal.entity.ShoppingListItem;
import com.bluepal.entity.User;

import java.util.List;

public interface ShoppingListService {
    ShoppingListItem addItem(User user, String name, String quantity, String unit, Recipe recipe);
    List<ShoppingListItem> getItems(User user);
    ShoppingListItem togglePurchased(Long id, User user);
    void deleteCheckedItems(User user);
    void addIngredientsFromRecipe(Long recipeId, User user);
    void addIngredientsFromMealPlan(User user, java.time.LocalDate startDate, java.time.LocalDate endDate);
}
