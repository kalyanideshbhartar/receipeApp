package com.bluepal.service.interfaces;

import com.bluepal.dto.request.MealPlanRequest;
import com.bluepal.dto.response.MealPlanResponse;
import com.bluepal.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface MealPlanService {
    MealPlanResponse addMealPlan(User user, MealPlanRequest request);
    List<MealPlanResponse> getMealPlans(User user, LocalDate startDate, LocalDate endDate);
    MealPlanResponse updateMealPlan(Long id, MealPlanRequest request, User user);
    void deleteMealPlan(Long id, User user);
}
