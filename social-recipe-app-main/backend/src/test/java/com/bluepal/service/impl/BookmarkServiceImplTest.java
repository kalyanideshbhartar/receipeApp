package com.bluepal.service.impl;

import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.entity.Bookmark;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.BookmarkRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.service.interfaces.RecipeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookmarkServiceImplTest {

    @Mock
    private BookmarkRepository bookmarkRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private RecipeService recipeService;

    @InjectMocks
    private BookmarkServiceImpl bookmarkService;

    private User user;
    private Recipe recipe;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        recipe = new Recipe();
        recipe.setId(100L);
        recipe.setTitle("Test Recipe");
    }

    @Test
    void toggleBookmark_Add() {
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(bookmarkRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(user, recipe)).thenReturn(Optional.empty());

        bookmarkService.toggleBookmark(user, 100L);

        verify(bookmarkRepository, times(1)).save(any(Bookmark.class));
        verify(bookmarkRepository, never()).delete(any(Bookmark.class));
    }

    @Test
    void toggleBookmark_Remove() {
        Bookmark bookmark = Bookmark.builder().user(user).recipe(recipe).build();
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(bookmarkRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(user, recipe)).thenReturn(Optional.of(bookmark));

        bookmarkService.toggleBookmark(user, 100L);

        verify(bookmarkRepository, times(1)).delete(bookmark);
        verify(bookmarkRepository, never()).save(any(Bookmark.class));
    }

    @Test
    void toggleBookmark_RecipeNotFound() {
        when(recipeRepository.findById(100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bookmarkService.toggleBookmark(user, 100L));
    }

    @Test
    void isBookmarked_True() {
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(bookmarkRepository.existsByUserAndRecipe(user, recipe)).thenReturn(true);

        assertTrue(bookmarkService.isBookmarked(user, 100L));
    }

    @Test
    void getBookmarkedRecipes_Success() {
        Bookmark bookmark = Bookmark.builder().user(user).recipe(recipe).build();
        when(bookmarkRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(bookmark));
        
        RecipeResponse response = RecipeResponse.builder().id(100L).title("Test Recipe").build();
        when(recipeService.getRecipeById(100L, "testuser")).thenReturn(response);

        List<RecipeResponse> results = bookmarkService.getBookmarkedRecipes(user);

        assertEquals(1, results.size());
        assertEquals("Test Recipe", results.get(0).getTitle());
    }
}
