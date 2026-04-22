package com.bluepal.service.impl;

import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.entity.Bookmark;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.BookmarkRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.service.interfaces.BookmarkService;
import com.bluepal.service.interfaces.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookmarkServiceImpl implements BookmarkService {
    private final BookmarkRepository bookmarkRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeService recipeService;

    public BookmarkServiceImpl(BookmarkRepository bookmarkRepository, 
                               RecipeRepository recipeRepository,
                               @Lazy RecipeService recipeService) {
        this.bookmarkRepository = bookmarkRepository;
        this.recipeRepository = recipeRepository;
        this.recipeService = recipeService;
    }

    @Override
    @Transactional
    public void toggleBookmark(User user, Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", "id", recipeId));

        bookmarkRepository.findFirstByUserAndRecipeOrderByCreatedAtDesc(user, recipe).ifPresentOrElse(
                bookmarkRepository::delete,
                () -> bookmarkRepository.save(Bookmark.builder().user(user).recipe(recipe).build()));
    }

    @Override
    public boolean isBookmarked(User user, Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId).orElse(null);
        if (recipe == null)
            return false;
        return bookmarkRepository.existsByUserAndRecipe(user, recipe);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecipeResponse> getBookmarkedRecipes(User user) {
        return bookmarkRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(b -> recipeService.getRecipeById(b.getRecipe().getId(), user.getUsername()))
                .collect(Collectors.toList());
    }
}
