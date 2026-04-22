package com.bluepal.service.interfaces;

import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;

public interface RatingService {
    void rateRecipe(User user, Long recipeId, Integer rating);
    Integer getUserRating(User user, Recipe recipe);
}
