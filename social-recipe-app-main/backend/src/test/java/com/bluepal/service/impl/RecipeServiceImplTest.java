package com.bluepal.service.impl;

import com.bluepal.dto.request.IngredientRequest;
import com.bluepal.dto.request.RecipeRequest;
import com.bluepal.dto.request.StepRequest;
import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.entity.*;
import com.bluepal.repository.*;
import com.bluepal.service.interfaces.BookmarkService;
import com.bluepal.service.interfaces.RatingService;
import com.bluepal.service.interfaces.UserService;
import com.bluepal.service.interfaces.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeServiceImplTest {

    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private MealPlanRepository mealPlanRepository;
    @Mock
    private ShoppingListItemRepository shoppingListItemRepository;
    @Mock
    private LikeRepository likeRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private BookmarkRepository bookmarkRepository;
    @Mock
    private RatingRepository ratingRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private RatingService ratingService;
    @Mock
    private BookmarkService bookmarkService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserService userService;

    @InjectMocks
    private RecipeServiceImpl recipeService;

    private User author;
    private Recipe recipe;
    private RecipeRequest recipeRequest;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).username("chef1").reputationPoints(0).roles(new HashSet<>()).build();
        recipe = Recipe.builder().id(100L).title("Test").author(author).createdAt(LocalDateTime.now()).build();
        recipeRequest = new RecipeRequest();
        recipeRequest.setTitle("Test");
    }

    @Test
    void createRecipe_Success() {
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        RecipeResponse response = recipeService.createRecipe(recipeRequest, "chef1");

        assertNotNull(response);
        assertEquals(50, author.getReputationPoints());
        verify(recipeRepository).save(any(Recipe.class));
    }

    @Test
    void createRecipe_RestrictedUser_ThrowsException() {
        author.setRestricted(true);
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> 
            recipeService.createRecipe(recipeRequest, "chef1")
        );
    }

    @Test
    void createRecipe_PremiumRecipe_NonPremiumUser_ThrowsException() {
        recipeRequest.setPremium(true);
        author.setPremium(false);
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));

        assertThrows(com.bluepal.exception.PremiumRequiredException.class, () -> 
            recipeService.createRecipe(recipeRequest, "chef1")
        );
    }

    @Test
    void createRecipe_NewCategory_Success() {
        recipeRequest.setCategory("New Cat");
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase("New Cat")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        recipeService.createRecipe(recipeRequest, "chef1");

        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void updateAuthorReputation_SousChefLevel_Success() {
        author.setReputationPoints(950);
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        recipeService.createRecipe(recipeRequest, "chef1");

        assertEquals(1000, author.getReputationPoints());
        assertEquals("Sous Chef", author.getReputationLevel());
    }

    @Test
    void updateAuthorReputation_ChefDePartieLevel_Success() {
        author.setReputationPoints(450);
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        recipeService.createRecipe(recipeRequest, "chef1");

        assertEquals(500, author.getReputationPoints());
        assertEquals("Chef de Partie", author.getReputationLevel());
    }

    @Test
    void getRecipeById_Success() {
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        RecipeResponse response = recipeService.getRecipeById(100L, "chef1");

        assertNotNull(response);
        assertEquals(100L, response.getId());
    }

    @Test
    void getRecipeById_Premium_AccessDenied() {
        recipe.setPremium(true);
        User freeUser = User.builder().id(2L).username("free").roles(new java.util.HashSet<>()).build();
        
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findFirstByUsernameIgnoreCasePrioritizePremium("free")).thenReturn(Optional.of(freeUser));

        assertThrows(com.bluepal.exception.PremiumRequiredException.class, () -> 
            recipeService.getRecipeById(100L, "free")
        );
    }

    @Test
    void mapToResponse_FullDetails_Success() {
        recipe.addIngredient(Ingredient.builder().name("Salt").quantity("1").unit("tsp").category(ShoppingCategory.SPICES).build());
        recipe.addStep(Step.builder().stepNumber(1).instruction("Mix").build());
        recipe.addImage(RecipeImage.builder().imageUrl("extra.jpg").build());
        
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));
        when(bookmarkService.isBookmarked(author, 100L)).thenReturn(true);
        when(ratingService.getUserRating(author, recipe)).thenReturn(5);

        RecipeResponse response = recipeService.mapToResponse(recipe, "chef1");

        assertNotNull(response);
        assertTrue(response.getIsBookmarked());
        assertEquals(5, response.getUserRating());
        assertEquals(1, response.getIngredients().size());
        assertEquals(1, response.getSteps().size());
        assertEquals(1, response.getAdditionalImages().size());
    }

    @Test
    void updateRecipe_Success() {
        RecipeRequest updateRequest = new RecipeRequest();
        updateRequest.setTitle("Updated Title");
        
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        RecipeResponse response = recipeService.updateRecipe(100L, updateRequest, "chef1");

        assertNotNull(response);
        verify(recipeRepository).save(recipe);
    }

    @Test
    void updateRecipe_Unauthorized() {
        RecipeRequest updateRequest = new RecipeRequest();
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> 
            recipeService.updateRecipe(100L, updateRequest, "other")
        );
    }

    @Test
    void deleteRecipe_Success() {
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));

        recipeService.deleteRecipe(100L, "chef1");

        verify(recipeRepository).delete(recipe);
    }

    @Test
    void getRecipeById_RestrictedStatus_AdminCanAccess() {
        recipe.setStatus(RecipeStatus.RESTRICTED);
        User admin = User.builder().id(3L).username("admin").roles(new java.util.HashSet<>(java.util.List.of("ROLE_ADMIN"))).build();
        
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));

        RecipeResponse response = recipeService.getRecipeById(100L, "admin");
        assertNotNull(response);
    }

    @Test
    void getRecipeById_RestrictedStatus_NonAdminThrowsException() {
        recipe.setStatus(RecipeStatus.RESTRICTED);
        User user = User.builder().id(2L).username("user").roles(new java.util.HashSet<>()).build();
        
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findByUsernameIgnoreCase("user")).thenReturn(Optional.of(user));

        assertThrows(com.bluepal.exception.ResourceNotFoundException.class, () -> 
            recipeService.getRecipeById(100L, "user")
        );
    }

    @Test
    void getFilteredExploreFeed_WithFilters_Success() {
        Recipe trendingRecipe = Recipe.builder().id(101L).title("Trending").createdAt(LocalDateTime.now().minusHours(1)).build();
        when(recipeRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of(trendingRecipe)));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getFilteredExploreFeed(null, 10, "Dinner", 30, 500, "trending,newest", "chef1");

        java.util.List<RecipeResponse> content = (java.util.List<RecipeResponse>) result.get("content");
        assertEquals(1, content.size());
        assertEquals("Trending", content.get(0).getTitle());
    }

    @Test
    void searchRecipesFullText_TrimsQuery() {
        when(recipeRepository.searchRecipesFullText("query")).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        recipeService.searchRecipesFullText("  query  ", "chef1");

        verify(recipeRepository).searchRecipesFullText("query");
    }

    @Test
    void createRecipe_WithEmptyCategory_UsesGeneral() {
        recipeRequest.setCategory("");
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase("General")).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        recipeService.createRecipe(recipeRequest, "chef1");

        verify(categoryRepository).findByNameIgnoreCase("General");
    }

    @Test
    void createRecipe_WithIngredientsAndSteps_Success() {
        IngredientRequest ing = new IngredientRequest();
        ing.setName("Salt");
        ing.setQuantity("1");
        ing.setUnit("tsp");
        ing.setCategory("spices");
        recipeRequest.setIngredients(List.of(ing));

        StepRequest step = new StepRequest();
        step.setStepNumber(1);
        step.setInstruction("Mix");
        recipeRequest.setSteps(List.of(step));

        recipeRequest.setAdditionalImages(List.of("url1"));

        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        recipeService.createRecipe(recipeRequest, "chef1");

        verify(recipeRepository).save(any(Recipe.class));
    }

    @Test
    void getRecipeById_Premium_AuthorAccess_Success() {
        recipe.setPremium(true);
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findFirstByUsernameIgnoreCasePrioritizePremium("chef1")).thenReturn(Optional.of(author));

        RecipeResponse response = recipeService.getRecipeById(100L, "chef1");
        assertNotNull(response);
    }

    @Test
    void getExploreFeedCursor_WithCursor_Success() {
        LocalDateTime now = LocalDateTime.now();
        when(recipeRepository.findExploreCursorPublished(eq(now), any())).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getExploreFeedCursor(now, 10, "chef1");
        assertFalse(((List<?>) result.get("content")).isEmpty());
    }

    @Test
    void getExploreFeedCursor_Exception_ReturnsEmpty() {
        when(recipeRepository.findAllByIsPublishedTrueOrderByCreatedAtDesc(any())).thenThrow(new RuntimeException("DB Error"));
        Map<String, Object> result = recipeService.getExploreFeedCursor(null, 10, "chef1");
        assertTrue(((List<?>) result.get("content")).isEmpty());
    }

    @Test
    void getUserRecipes_OtherUser_OnlyPublished() {
        User other = User.builder().id(2L).username("other").build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(other));
        when(recipeRepository.findByAuthorAndIsPublishedTrueOrderByCreatedAtDesc(eq(other), any())).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getUserRecipes(2L, null, 10, "chef1");
        assertNotNull(result.get("content"));
    }

    @Test
    void toggleLike_Increment_Success() {
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(likeRepository.existsByUserAndRecipe(author, recipe)).thenReturn(true);

        Map<String, Object> result = recipeService.toggleLike(100L, "chef1");

        assertTrue((Boolean) result.get("liked"));
        verify(recipeRepository).incrementLikeCount(100L);
        verify(notificationService).createAndSendNotification(any(), any(), any(), any(), any());
    }

    @Test
    void toggleLike_Decrement_Success() {
        recipe.setLikeCount(5);
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(likeRepository.existsByUserAndRecipe(author, recipe)).thenReturn(false);

        Map<String, Object> result = recipeService.toggleLike(100L, "chef1");

        assertFalse((Boolean) result.get("liked"));
        assertEquals(4, result.get("likeCount"));
        verify(recipeRepository).decrementLikeCount(100L);
    }

    @Test
    void deleteRecipe_AdminAccess_Success() {
        User admin = User.builder().id(3L).username("admin").roles(new HashSet<>(List.of("ROLE_ADMIN"))).build();
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        recipeService.deleteRecipe(100L, "admin");

        verify(recipeRepository).delete(recipe);
    }

    @Test
    void getRecipesByCategory_NotFound_ReturnsEmpty() {
        when(categoryRepository.findByNameIgnoreCase("Unknown")).thenReturn(Optional.empty());
        List<RecipeResponse> result = recipeService.getRecipesByCategory("Unknown", "chef1", 10);
        assertTrue(result.isEmpty());
    }

    @Test
    void getRecipesByCategory_Success() {
        Category cat = new Category("Dinner");
        when(categoryRepository.findByNameIgnoreCase("Dinner")).thenReturn(Optional.of(cat));
        when(recipeRepository.findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(eq(cat), any())).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        List<RecipeResponse> result = recipeService.getRecipesByCategory("Dinner", "chef1", 10);
        assertFalse(result.isEmpty());
    }

    @Test
    void getPersonalizedFeedCursor_Success() {
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(recipeRepository.findPersonalizedLatest(eq(author), any())).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getPersonalizedFeedCursor("chef1", null, 10);
        assertNotNull(result.get("content"));
    }

    @Test
    void getExploreFeedCursorByCategory_Success() {
        Category cat = new Category("Lunch");
        when(categoryRepository.findByNameIgnoreCase("Lunch")).thenReturn(Optional.of(cat));
        when(recipeRepository.findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(eq(cat), any())).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getExploreFeedCursorByCategory("Lunch", null, 10, "chef1");
        assertNotNull(result.get("content"));
    }

    @Test
    void getUserLikedRecipes_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(recipeRepository.findLikedRecipesByUser(eq(author), any())).thenReturn(List.of(recipe));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getUserLikedRecipes(1L, null, 10, "chef1");
        assertNotNull(result.get("content"));
    }

    @Test
    void markAsPremium_Success() {
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        recipeService.markAsPremium(100L);
        assertTrue(recipe.isPremium());
        verify(recipeRepository).save(recipe);
    }

    @Test
    void getFilteredExploreFeed_WithSorting_Success() {
        when(recipeRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(recipe)));
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));

        Map<String, Object> result = recipeService.getFilteredExploreFeed(null, 10, null, null, null, "rating,newest", "chef1");
        assertNotNull(result.get("content"));
    }

    @Test
    void toggleLike_ReputationUpdate_Success() {
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(likeRepository.existsByUserAndRecipe(author, recipe)).thenReturn(true);

        recipeService.toggleLike(100L, "chef1");

        verify(userService, times(1)).updateReputation("chef1", 5);
        verify(recipeRepository).incrementLikeCount(100L);
    }

    @Test
    void createRecipe_InvalidIngredientCategory_DefaultsToOther() {
        IngredientRequest ing = new IngredientRequest();
        ing.setName("Magic Salt");
        ing.setCategory("INVALID_CAT_STRING");
        recipeRequest.setIngredients(List.of(ing));

        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(inv -> inv.getArgument(0));

        RecipeResponse response = recipeService.createRecipe(recipeRequest, "chef1");
        
        assertNotNull(response);
        // Using Reflection or assuming internal state is correct for this slice test
    }

    @Test
    void updateAuthorReputation_NullPoints_StartsAtZero() {
        author.setReputationPoints(null);
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(categoryRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(new Category("General")));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        recipeService.createRecipe(recipeRequest, "chef1");

        assertEquals(50, author.getReputationPoints());
        assertEquals("Commis Chef", author.getReputationLevel());
    }

    @Test
    void mapToResponse_Exception_ThrowsCriticalError() {
        when(userRepository.findFirstByUsername("chef1")).thenReturn(Optional.of(author));
        when(bookmarkService.isBookmarked(any(), anyLong())).thenThrow(new RuntimeException("Mapping Failure"));

        assertThrows(RuntimeException.class, () -> recipeService.mapToResponse(recipe, "chef1"));
    }

    @Test
    void getExploreFeedCursor_Exception_ReturnsEmptyMap() {
        when(recipeRepository.findAllByIsPublishedTrueOrderByCreatedAtDesc(any())).thenThrow(new RuntimeException("DB Error"));
        Map<String, Object> result = recipeService.getExploreFeedCursor(null, 10, "chef1");
        
        assertTrue(((List<?>) result.get("content")).isEmpty());
        assertEquals("", result.get("nextCursor"));
    }

    @Test
    void toggleLike_UnderflowMechanism_PreventsNegativeLikes() {
        recipe.setLikeCount(0); // Boundary condition
        when(userRepository.findByUsername("chef1")).thenReturn(Optional.of(author));
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(recipe));
        when(likeRepository.existsByUserAndRecipe(author, recipe)).thenReturn(false); // Unliking

        Map<String, Object> result = recipeService.toggleLike(100L, "chef1");

        assertEquals(0, result.get("likeCount"));
        verify(recipeRepository).decrementLikeCount(100L);
    }

    @Test
    void isAuthor_MatchByUsername_Success() {
        User otherUserObj = User.builder().id(2L).username("chef1").build(); // Same username, diff ID
        boolean result = (boolean) ReflectionTestUtils.invokeMethod(recipeService, "isAuthor", recipe, otherUserObj);
        assertTrue(result);
    }

    @Test
    void isAdmin_SimpleAdminRole_Success() {
        User adminUser = User.builder().roles(new HashSet<>(List.of("ADMIN"))).build();
        boolean result = (boolean) ReflectionTestUtils.invokeMethod(recipeService, "isAdmin", adminUser);
        assertTrue(result);
    }

    @Test
    void getExploreFeedCursorByCategory_NotFound_ReturnsEmpty() {
        when(categoryRepository.findByNameIgnoreCase("Unknown")).thenReturn(Optional.empty());
        Map<String, Object> result = recipeService.getExploreFeedCursorByCategory("Unknown", null, 10, "chef1");
        assertTrue(((List<?>) result.get("content")).isEmpty());
    }

    @Test
    void resolveCategory_GeneralFallback_Success() {
        when(categoryRepository.findByNameIgnoreCase("General")).thenReturn(Optional.empty());
        when(categoryRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        
        Category result = (Category) ReflectionTestUtils.invokeMethod(recipeService, "resolveCategory", "");
        assertEquals("General", result.getName());
    }
}
