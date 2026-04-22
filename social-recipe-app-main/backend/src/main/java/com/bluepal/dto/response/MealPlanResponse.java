package com.bluepal.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealPlanResponse {
    private Long id;
    private Long recipeId;
    private String recipeTitle;
    private String recipeImageUrl;
    private LocalDate plannedDate;
    private String mealType;
    private Integer servingsAdjustment;
    private String status;
    private Integer calories;
    private Double protein;
    private Double carbs;
    private Double fats;
}
