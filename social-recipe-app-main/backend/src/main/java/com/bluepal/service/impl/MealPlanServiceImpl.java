package com.bluepal.service.impl;

import com.bluepal.dto.request.MealPlanRequest;
import com.bluepal.dto.response.MealPlanResponse;
import com.bluepal.entity.MealPlan;
import com.bluepal.entity.MealPlanStatus;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.repository.MealPlanRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.service.interfaces.MealPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bluepal.exception.ResourceNotFoundException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MealPlanServiceImpl implements MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;

    @Override
    @Transactional
    public MealPlanResponse addMealPlan(User user, MealPlanRequest request) {
        Recipe recipe = recipeRepository.findById(request.getRecipeId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", "id", request.getRecipeId()));

        MealPlanStatus status = MealPlanStatus.PLANNED;
        if (request.getStatus() != null) {
            try {
                status = MealPlanStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Default to PLANNED if status is invalid
            }
        }

        MealPlan mealPlan = MealPlan.builder()
                .user(user)
                .recipe(recipe)
                .plannedDate(request.getPlannedDate())
                .mealType(request.getMealType())
                .servingsAdjustment(request.getServingsAdjustment() != null ? request.getServingsAdjustment() : 0)
                .status(status)
                .build();
        
        return mapToResponse(mealPlanRepository.save(mealPlan));
    }

    @Override
    @Transactional
    public MealPlanResponse updateMealPlan(Long id, MealPlanRequest request, User user) {
        MealPlan mealPlan = mealPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MealPlan", "id", id));

        if (!mealPlan.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to update this meal plan");
        }

        if (request.getPlannedDate() != null) mealPlan.setPlannedDate(request.getPlannedDate());
        if (request.getMealType() != null) mealPlan.setMealType(request.getMealType());
        if (request.getServingsAdjustment() != null) mealPlan.setServingsAdjustment(request.getServingsAdjustment());
        
        if (request.getStatus() != null) {
            try {
                mealPlan.setStatus(MealPlanStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // Keep existing status if invalid
            }
        }

        return mapToResponse(mealPlanRepository.save(mealPlan));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MealPlanResponse> getMealPlans(User user, LocalDate startDate, LocalDate endDate) {
        List<MealPlan> plans = mealPlanRepository.findByUserAndPlannedDateBetween(user, startDate, endDate);
        return plans.stream().map(this::mapToResponse).toList();
    }

    private MealPlanResponse mapToResponse(MealPlan mealPlan) {
        Recipe recipe = mealPlan.getRecipe();
        return MealPlanResponse.builder()
                .id(mealPlan.getId())
                .recipeId(recipe.getId())
                .recipeTitle(recipe.getTitle())
                .recipeImageUrl(recipe.getImageUrl())
                .plannedDate(mealPlan.getPlannedDate())
                .mealType(mealPlan.getMealType())
                .servingsAdjustment(mealPlan.getServingsAdjustment())
                .status(mealPlan.getStatus().name())
                .calories(recipe.getCalories())
                .protein(recipe.getProtein())
                .carbs(recipe.getCarbs())
                .fats(recipe.getFats())
                .build();
    }

    @Override
    @Transactional
    public void deleteMealPlan(Long id, User user) {
        MealPlan mealPlan = mealPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MealPlan", "id", id));
        
        if (!mealPlan.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to delete this meal plan");
        }
        
        mealPlanRepository.delete(mealPlan);
    }
}
