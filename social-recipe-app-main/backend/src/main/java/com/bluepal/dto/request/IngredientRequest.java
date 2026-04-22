package com.bluepal.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IngredientRequest {
    @NotBlank(message = "Ingredient name is required")
    private String name;

    @NotBlank(message = "Quantity is required")
    private String quantity;

    private String unit;

    private String category; // Maps to ShoppingCategory enum
}
