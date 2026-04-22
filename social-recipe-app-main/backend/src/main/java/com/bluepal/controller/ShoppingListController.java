package com.bluepal.controller;

import com.bluepal.dto.request.ShoppingListItemRequest;
import com.bluepal.dto.response.ShoppingListItemResponse;
import com.bluepal.entity.ShoppingListItem;
import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.ShoppingListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.bluepal.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shopping-list")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService shoppingListService;
    private final UserRepository userRepository;
    
    private static final String USER_NOT_FOUND = "User not found";

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    @PostMapping
    public ResponseEntity<ShoppingListItemResponse> addItem(@RequestBody ShoppingListItemRequest request) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND));
        
        ShoppingListItem item = shoppingListService.addItem(user, request.getName(), request.getQuantity(), request.getUnit(), null);
        return ResponseEntity.ok(mapToResponse(item));
    }

    @GetMapping
    public ResponseEntity<List<ShoppingListItemResponse>> getItems() {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND));
        
        List<ShoppingListItem> items = shoppingListService.getItems(user);
        return ResponseEntity.ok(items.stream().map(this::mapToResponse).toList());
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ShoppingListItemResponse> togglePurchased(@PathVariable Long id) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND));
        
        ShoppingListItem item = shoppingListService.togglePurchased(id, user);
        return ResponseEntity.ok(mapToResponse(item));
    }

    @DeleteMapping("/checked")
    public ResponseEntity<Void> deleteCheckedItems() {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND));
        
        shoppingListService.deleteCheckedItems(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/from-recipe/{recipeId}")
    public ResponseEntity<com.bluepal.dto.response.MessageResponse> addFromRecipe(@PathVariable Long recipeId) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND));
        
        shoppingListService.addIngredientsFromRecipe(recipeId, user);
        return ResponseEntity.ok(new com.bluepal.dto.response.MessageResponse("Ingredients from recipe added to shopping list."));
    }

    @PostMapping("/from-meal-plan")
    public ResponseEntity<com.bluepal.dto.response.MessageResponse> addFromMealPlan(
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND));
        
        shoppingListService.addIngredientsFromMealPlan(user, startDate, endDate);
        return ResponseEntity.ok(new com.bluepal.dto.response.MessageResponse("Ingredients from meal plan added to shopping list."));
    }

    private ShoppingListItemResponse mapToResponse(ShoppingListItem item) {
        return ShoppingListItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .category(item.getCategory() != null ? item.getCategory().name() : "OTHER")
                .recipeId(item.getRecipe() != null ? item.getRecipe().getId() : null)
                .recipeTitle(item.getRecipe() != null ? item.getRecipe().getTitle() : null)
                .purchased(item.isPurchased())
                .build();
    }
}
