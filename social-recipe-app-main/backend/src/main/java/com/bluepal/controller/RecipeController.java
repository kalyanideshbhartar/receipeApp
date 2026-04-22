package com.bluepal.controller;

import com.bluepal.dto.request.RecipeRequest;
import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.security.SecurityUtils;
import com.bluepal.service.interfaces.CloudinaryService;
import com.bluepal.service.interfaces.RecipeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api")
public class RecipeController {

    private final RecipeService recipeService;
    private final CloudinaryService cloudinaryService;

    public RecipeController(RecipeService recipeService, CloudinaryService cloudinaryService) {
        this.recipeService = recipeService;
        this.cloudinaryService = cloudinaryService;
    }

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    // ─── Feeds (Aligned with Spec) ─────────────────────────────────────────────
    @GetMapping("/recipes/explore")
    public ResponseEntity<Map<String, Object>> getExploreFeed(
            @RequestParam(name = "cursor", required = false) String cursorStr,
            @RequestParam(name = "size", defaultValue = "12") int size,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "maxTime", required = false) Integer maxTime,
            @RequestParam(name = "maxCalories", required = false) Integer maxCalories,
            @RequestParam(name = "sort", defaultValue = "newest") String sort) {
        
        LocalDateTime cursor = (cursorStr != null && !cursorStr.isEmpty()) 
                ? LocalDateTime.parse(cursorStr) 
                : null;

        return ResponseEntity.ok(recipeService.getFilteredExploreFeed(cursor, size, category, maxTime, maxCalories, sort, getCurrentUsername()));
    }

    @GetMapping("/recipes/trending")
    public ResponseEntity<List<RecipeResponse>> getTrendingRecipes(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(recipeService.getTrendingRecipes(getCurrentUsername(), limit));
    }

    @GetMapping("/recipes/category/{category}")
    public ResponseEntity<List<RecipeResponse>> getRecipesByCategory(
            @PathVariable("category") String category,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(recipeService.getRecipesByCategory(category, getCurrentUsername(), limit));
    }

    // ─── Personalized Feed (Aligned with Spec) ────────────────────────────────
    @GetMapping("/recipes/feed")
    public ResponseEntity<Map<String, Object>> getPersonalizedFeed(
            @RequestParam(name = "cursor", required = false) String cursorStr,
            @RequestParam(name = "size", defaultValue = "12") int size) {
        
        LocalDateTime cursor = (cursorStr != null && !cursorStr.isEmpty()) 
                ? LocalDateTime.parse(cursorStr) 
                : null;

        return ResponseEntity.ok(recipeService.getPersonalizedFeedCursor(getCurrentUsername(), cursor, size));
    }

    // ─── Search (Updated to Full-Text) ─────────────────────────────────────────
    @GetMapping("/recipes/search")
    public ResponseEntity<List<RecipeResponse>> searchRecipes(
            @RequestParam(name = "q") String q) {
        return ResponseEntity.ok(recipeService.searchRecipesFullText(q, getCurrentUsername()));
    }

    // ─── Recipe CRUD ────────────────────────────────────────────────────────────
    @PostMapping("/recipes")
    public ResponseEntity<RecipeResponse> createRecipe(@Valid @RequestBody RecipeRequest request) {
        return ResponseEntity.ok(recipeService.createRecipe(request, getCurrentUsername()));
    }

    @GetMapping("/recipes/{id}")
    public ResponseEntity<RecipeResponse> getRecipeById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(recipeService.getRecipeById(id, getCurrentUsername()));
    }

    @PutMapping("/recipes/{id}")
    public ResponseEntity<RecipeResponse> updateRecipe(
            @PathVariable("id") Long id, @Valid @RequestBody RecipeRequest request) {
        return ResponseEntity.ok(recipeService.updateRecipe(id, request, getCurrentUsername()));
    }

    @DeleteMapping("/recipes/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable("id") Long id) {
        recipeService.deleteRecipe(id, getCurrentUsername());
        return ResponseEntity.noContent().build();
    }

    // ─── User Profile Lists (Aligned with Spec) ────────────────────────────────
    @GetMapping("/users/{id}/recipes")
    public ResponseEntity<Map<String, Object>> getUserRecipes(
            @PathVariable("id") Long id,
            @RequestParam(name = "cursor", required = false) String cursorStr,
            @RequestParam(name = "size", defaultValue = "12") int size) {
        
        LocalDateTime cursor = (cursorStr != null && !cursorStr.isEmpty()) 
                ? LocalDateTime.parse(cursorStr) 
                : null;
        return ResponseEntity.ok(recipeService.getUserRecipes(id, cursor, size, getCurrentUsername()));
    }

    @GetMapping("/users/{id}/liked-recipes")
    public ResponseEntity<Map<String, Object>> getLikedRecipes(
            @PathVariable("id") Long id,
            @RequestParam(name = "cursor", required = false) String cursorStr,
            @RequestParam(name = "size", defaultValue = "12") int size) {
        
        LocalDateTime cursor = (cursorStr != null && !cursorStr.isEmpty()) 
                ? LocalDateTime.parse(cursorStr) 
                : null;
        return ResponseEntity.ok(recipeService.getUserLikedRecipes(id, cursor, size, getCurrentUsername()));
    }

    @GetMapping("/cloudinary/signature")
    public ResponseEntity<Map<String, String>> getCloudinarySignature(
            @RequestParam(name = "folder") String folder) {
        return ResponseEntity.ok(cloudinaryService.generateSignedUploadUrl(folder));
    }
}
