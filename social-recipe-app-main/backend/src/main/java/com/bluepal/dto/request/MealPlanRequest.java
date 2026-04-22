package com.bluepal.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MealPlanRequest {
    private Long recipeId;
    private LocalDate plannedDate;
    private String mealType;
    private Integer servingsAdjustment;
    private String status;
}
