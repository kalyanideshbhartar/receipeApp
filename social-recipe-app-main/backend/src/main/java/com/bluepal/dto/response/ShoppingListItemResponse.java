package com.bluepal.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShoppingListItemResponse {
    private Long id;
    private String name;
    private String quantity;
    private String unit;
    private String category;
    private Long recipeId;
    private String recipeTitle;
    private boolean purchased;
}
