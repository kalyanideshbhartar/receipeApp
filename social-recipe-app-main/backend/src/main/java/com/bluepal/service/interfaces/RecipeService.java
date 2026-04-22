package com.bluepal.service.interfaces;

import com.bluepal.dto.request.RecipeRequest;
import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.entity.Recipe;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface RecipeService {
    RecipeResponse createRecipe(RecipeRequest request, String username);
    RecipeResponse getRecipeById(Long id, String currentUsername);

    // Cursor-based feeds for Infinite Scroll
    Map<String, Object> getExploreFeedCursor(LocalDateTime cursor, int size, String currentUsername);
    Map<String, Object> getFilteredExploreFeed(LocalDateTime cursor, int size, String category, Integer maxTime, Integer maxCalories, String sort, String currentUsername);
    Map<String, Object> getPersonalizedFeedCursor(String username, LocalDateTime cursor, int size);

    // Full-text search by ingredient
    List<RecipeResponse> searchRecipesFullText(String query, String currentUsername);

    Map<String, Object> getUserRecipes(Long userId, LocalDateTime cursor, int size, String currentUsername);
    Map<String, Object> getUserLikedRecipes(Long userId, LocalDateTime cursor, int size, String currentUsername);

    // Categorization & Trending
    List<RecipeResponse> getTrendingRecipes(String currentUsername, int limit);
    List<RecipeResponse> getRecipesByCategory(String category, String currentUsername, int limit);
    Map<String, Object> getExploreFeedCursorByCategory(String category, LocalDateTime cursor, int size, String currentUsername);

    RecipeResponse updateRecipe(Long id, RecipeRequest request, String username);
    void deleteRecipe(Long id, String username);
    void markAsPremium(Long id);
    RecipeResponse mapToResponse(Recipe recipe, String currentUsername);
    Recipe getRecipeEntity(Long id);
    Map<String, Object> toggleLike(Long id, String username);
}