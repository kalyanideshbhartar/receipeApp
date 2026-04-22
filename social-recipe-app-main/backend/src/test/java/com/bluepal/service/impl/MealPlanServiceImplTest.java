package com.bluepal.service.impl;

import com.bluepal.dto.request.MealPlanRequest;
import com.bluepal.dto.response.MealPlanResponse;
import com.bluepal.entity.MealPlan;
import com.bluepal.entity.MealPlanStatus;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.repository.MealPlanRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MealPlanServiceImplTest {

    @Mock
    private MealPlanRepository mealPlanRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @InjectMocks
    private MealPlanServiceImpl mealPlanService;

    private User user;
    private Recipe recipe;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        recipe = new Recipe();
        recipe.setId(100L);
        recipe.setTitle("Test Recipe");
        recipe.setCalories(500);
        recipe.setProtein(20.0);
        recipe.setCarbs(50.0);
        recipe.setFats(15.0);
    }

    @Test
    void addMealPlan_Success() {
        MealPlanRequest request = new MealPlanRequest();
        request.setRecipeId(100L);
        request.setPlannedDate(LocalDate.now());
        request.setMealType("Lunch");
        request.setStatus("PLANNED");

        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(mealPlanRepository.save(any(MealPlan.class))).thenAnswer(i -> {
            MealPlan mp = i.getArgument(0);
            mp.setId(50L);
            return mp;
        });

        MealPlanResponse response = mealPlanService.addMealPlan(user, request);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals("Test Recipe", response.getRecipeTitle());
        assertEquals("PLANNED", response.getStatus());
        verify(mealPlanRepository, times(1)).save(any(MealPlan.class));
    }

    @Test
    void updateMealPlan_Success() {
        MealPlan existingPlan = MealPlan.builder()
                .id(50L)
                .user(user)
                .recipe(recipe)
                .status(MealPlanStatus.PLANNED)
                .build();

        MealPlanRequest request = new MealPlanRequest();
        request.setStatus("EATEN");

        when(mealPlanRepository.findById(50L)).thenReturn(Optional.of(existingPlan));
        when(mealPlanRepository.save(any(MealPlan.class))).thenReturn(existingPlan);

        MealPlanResponse response = mealPlanService.updateMealPlan(50L, request, user);

        assertEquals("EATEN", response.getStatus());
        verify(mealPlanRepository, times(1)).save(existingPlan);
    }

    @Test
    void updateMealPlan_Unauthorized() {
        User otherUser = new User();
        otherUser.setId(2L);

        MealPlan existingPlan = MealPlan.builder()
                .id(50L)
                .user(otherUser)
                .recipe(recipe)
                .build();

        MealPlanRequest request = new MealPlanRequest();

        when(mealPlanRepository.findById(50L)).thenReturn(Optional.of(existingPlan));

        assertThrows(RuntimeException.class, () -> mealPlanService.updateMealPlan(50L, request, user));
    }

    @Test
    void getMealPlans_Success() {
        LocalDate now = LocalDate.now();
        MealPlan plan = MealPlan.builder()
                .id(50L)
                .user(user)
                .recipe(recipe)
                .plannedDate(now)
                .status(MealPlanStatus.PLANNED)
                .build();

        when(mealPlanRepository.findByUserAndPlannedDateBetween(user, now, now)).thenReturn(List.of(plan));

        List<MealPlanResponse> results = mealPlanService.getMealPlans(user, now, now);

        assertEquals(1, results.size());
        assertEquals(50L, results.get(0).getId());
    }

    @Test
    void deleteMealPlan_Success() {
        MealPlan plan = MealPlan.builder()
                .id(50L)
                .user(user)
                .recipe(recipe)
                .build();

        when(mealPlanRepository.findById(50L)).thenReturn(Optional.of(plan));

        mealPlanService.deleteMealPlan(50L, user);

        verify(mealPlanRepository, times(1)).delete(plan);
    }
    @Test
    void addMealPlan_RecipeNotFound() {
        MealPlanRequest request = new MealPlanRequest();
        request.setRecipeId(999L);
        when(recipeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> mealPlanService.addMealPlan(user, request));
    }

    @Test
    void updateMealPlan_NotFound() {
        MealPlanRequest request = new MealPlanRequest();
        when(mealPlanRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> mealPlanService.updateMealPlan(999L, request, user));
    }

    @Test
    void deleteMealPlan_NotFound() {
        when(mealPlanRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> mealPlanService.deleteMealPlan(999L, user));
    }
}
