package com.bluepal.service.impl;

import com.bluepal.entity.Rating;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.repository.RatingRepository;
import com.bluepal.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceImplTest {

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @InjectMocks
    private RatingServiceImpl ratingService;

    private User mockUser;
    private Recipe mockRecipe;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setUsername("testuser");

        mockRecipe = new Recipe();
        mockRecipe.setId(1L);
        mockRecipe.setAverageRating(0.0);
        mockRecipe.setRatingCount(0);
    }

    @Test
    void rateRecipe_NewRating_Success() {
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(mockRecipe));
        when(ratingRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.empty());
        when(ratingRepository.getAverageRatingByRecipe(any())).thenReturn(4.0);
        when(ratingRepository.countByRecipe(any())).thenReturn(1L);

        ratingService.rateRecipe(mockUser, 1L, 4);

        verify(ratingRepository).save(any());
        verify(recipeRepository).save(mockRecipe);
        assertEquals(4.0, mockRecipe.getAverageRating());
        assertEquals(1, mockRecipe.getRatingCount());
    }

    @Test
    void rateRecipe_InvalidRating_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> {
            ratingService.rateRecipe(mockUser, 1L, 6);
        });
    }

    @Test
    void getUserRating_Success() {
        Rating rating = new Rating();
        rating.setScore(3);
        when(ratingRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.of(rating));

        Integer result = ratingService.getUserRating(mockUser, mockRecipe);
        assertEquals(3, result);
    }

    @Test
    void getUserRating_NoRating_ReturnsZero() {
        when(ratingRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.empty());

        Integer result = ratingService.getUserRating(mockUser, mockRecipe);
        assertEquals(0, result);
    }
}
