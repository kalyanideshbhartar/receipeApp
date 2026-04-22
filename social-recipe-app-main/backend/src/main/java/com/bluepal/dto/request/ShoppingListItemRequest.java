package com.bluepal.dto.request;

import lombok.Data;

@Data
public class ShoppingListItemRequest {
    private String name;
    private String quantity;
    private String unit;
}
