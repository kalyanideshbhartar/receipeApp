package com.bluepal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class RecipeRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String imageUrl;

    private List<String> additionalImages;

    @Min(value = 0, message = "Prep time cannot be negative")
    @Max(value = 1440, message = "Prep time cannot exceed 24 hours")
    private Integer prepTimeMinutes;

    @Min(value = 0, message = "Cook time cannot be negative")
    @Max(value = 1440, message = "Cook time cannot exceed 24 hours")
    private Integer cookTimeMinutes;

    @Min(value = 1, message = "Servings must be at least 1")
    @Max(value = 100, message = "Servings cannot exceed 100")
    private Integer servings;

    @PositiveOrZero(message = "Calories cannot be negative")
    private Integer calories;
    @PositiveOrZero(message = "Protein cannot be negative")
    private Double protein;
    @PositiveOrZero(message = "Carbs cannot be negative")
    private Double carbs;
    @PositiveOrZero(message = "Fats cannot be negative")
    private Double fats;
    private boolean isPublished = true;
    @com.fasterxml.jackson.annotation.JsonProperty("isPremium")
    private boolean isPremium = false;

    @NotNull(message = "Category is required")
    private String category; // Maps to RecipeCategory enum

    @NotEmpty(message = "At least one ingredient is required")
    private List<IngredientRequest> ingredients;

    @NotEmpty(message = "At least one step is required")
    private List<StepRequest> steps;
}
