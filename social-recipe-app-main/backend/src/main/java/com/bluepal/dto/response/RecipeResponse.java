package com.bluepal.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecipeResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private List<String> additionalImages;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private Integer servings;
    private Integer calories;
    private Double protein;
    private Double carbs;
    private Double fats;
    private Integer likeCount;
    private Integer commentCount;
    private Double averageRating;
    private Integer ratingCount;
    private String category;
    private Boolean isLiked; // true if current user has liked this recipe
    private Boolean isBookmarked;
    private Integer userRating; // Current user's rating for this recipe
    private Boolean isPublished;
    private String content;
    @com.fasterxml.jackson.annotation.JsonProperty("isPremium")
    private Boolean isPremium;
    private AuthorDto author;
    private List<IngredientDto> ingredients;
    private List<StepDto> steps;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuthorDto {
        private Long id;
        private String username;
        private String profilePictureUrl;
        private Boolean isVerified;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class IngredientDto {
        private Long id;
        private String name;
        private String quantity;
        private String unit;
        private String category;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StepDto {
        private Long id;
        private Integer stepNumber;
        private String instruction;
    }
}
