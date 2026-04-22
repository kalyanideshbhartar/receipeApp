package com.bluepal.service.impl;

import com.bluepal.entity.Rating;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.RatingRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.service.interfaces.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final RecipeRepository recipeRepository;

    @Override
    @Transactional
    public void rateRecipe(User user, Long recipeId, Integer ratingValue) {
        if (ratingValue < 1 || ratingValue > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", "id", recipeId));

        Rating rating = ratingRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(user, recipe)
                .orElse(Rating.builder().user(user).recipe(recipe).build());

        rating.setScore(ratingValue);
        ratingRepository.save(rating);

        // Update recipe average rating
        updateRecipeRating(recipe);
    }

    @Override
    public Integer getUserRating(User user, Recipe recipe) {
        return ratingRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(user, recipe)
                .map(Rating::getScore)
                .orElse(0);
    }

    private void updateRecipeRating(Recipe recipe) {
        Double avg = ratingRepository.getAverageRatingByRecipe(recipe);
        long count = ratingRepository.countByRecipe(recipe);

        recipe.setAverageRating(avg != null ? avg : 0.0);
        recipe.setRatingCount((int) count);
        recipeRepository.save(recipe);
    }
}
