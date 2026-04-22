package com.bluepal.service.interfaces;

import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.entity.User;

import java.util.List;

public interface BookmarkService {
    void toggleBookmark(User user, Long recipeId);
    boolean isBookmarked(User user, Long recipeId);
    List<RecipeResponse> getBookmarkedRecipes(User user);
}
