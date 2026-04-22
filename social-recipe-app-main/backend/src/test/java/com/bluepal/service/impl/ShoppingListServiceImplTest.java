package com.bluepal.service.impl;

import com.bluepal.entity.*;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.MealPlanRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.repository.ShoppingListItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceImplTest {

    @Mock
    private ShoppingListItemRepository shoppingListItemRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private MealPlanRepository mealPlanRepository;

    @InjectMocks
    private ShoppingListServiceImpl shoppingListService;

    private User testUser;
    private Recipe testRecipe;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testRecipe = new Recipe();
        testRecipe.setId(100L);
        testRecipe.setTitle("Pasta");
    }

    @Test
    void addItem_NewItem_Success() {
        when(shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(any(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.empty());
        when(shoppingListItemRepository.save(any(ShoppingListItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShoppingListItem item = shoppingListService.addItem(testUser, "Tomato", "2", "kg", testRecipe);

        assertNotNull(item);
        assertEquals("Tomato", item.getName());
        assertEquals("2", item.getQuantity());
        assertEquals(ShoppingCategory.VEGETABLES, item.getCategory());
    }

    @Test
    void addItem_MergeQuantities_Numeric() {
        ShoppingListItem existing = ShoppingListItem.builder()
                .name("Milk")
                .quantity("1")
                .unit("L")
                .purchased(false)
                .build();

        when(shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(any(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.of(existing));
        when(shoppingListItemRepository.save(any(ShoppingListItem.class))).thenReturn(existing);

        ShoppingListItem item = shoppingListService.addItem(testUser, "Milk", "2", "L", null);

        assertEquals("3", item.getQuantity());
    }

    @Test
    void addItem_MergeQuantities_Decimal() {
        ShoppingListItem existing = ShoppingListItem.builder()
                .quantity("1.5")
                .build();
        when(shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(any(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.of(existing));
        when(shoppingListItemRepository.save(any(ShoppingListItem.class))).thenReturn(existing);

        ShoppingListItem item = shoppingListService.addItem(testUser, "Flour", "0.5", "kg", null);

        assertEquals("2", item.getQuantity()); // Formats as 2 if long
    }

    @Test
    void addItem_MergeQuantities_NonNumeric() {
        ShoppingListItem existing = ShoppingListItem.builder()
                .quantity("a bit")
                .build();
        when(shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(any(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.of(existing));
        when(shoppingListItemRepository.save(any(ShoppingListItem.class))).thenReturn(existing);

        ShoppingListItem item = shoppingListService.addItem(testUser, "Salt", "some", "pinch", null);

        assertEquals("a bit + some", item.getQuantity());
    }

    @Test
    void togglePurchased_Success() {
        ShoppingListItem item = ShoppingListItem.builder()
                .id(1L)
                .user(testUser)
                .purchased(false)
                .build();
        when(shoppingListItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(shoppingListItemRepository.save(any())).thenReturn(item);

        ShoppingListItem result = shoppingListService.togglePurchased(1L, testUser);

        assertTrue(result.isPurchased());
    }

    @Test
    void togglePurchased_AccessDenied() {
        User otherUser = new User();
        otherUser.setId(2L);
        ShoppingListItem item = ShoppingListItem.builder()
                .id(1L)
                .user(otherUser)
                .build();
        when(shoppingListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThrows(AccessDeniedException.class, () -> shoppingListService.togglePurchased(1L, testUser));
    }

    @Test
    void addIngredientsFromRecipe_Success() {
        Ingredient i1 = new Ingredient(); i1.setName("Onion"); i1.setQuantity("1"); i1.setUnit("pc");
        testRecipe.setIngredients(Collections.singletonList(i1));

        when(recipeRepository.findById(100L)).thenReturn(Optional.of(testRecipe));
        when(shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(any(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.empty());

        shoppingListService.addIngredientsFromRecipe(100L, testUser);

        verify(shoppingListItemRepository, times(1)).save(any());
    }

    @Test
    void addIngredientsFromMealPlan_Success() {
        MealPlan plan = new MealPlan();
        plan.setRecipe(testRecipe);
        when(mealPlanRepository.findByUserAndPlannedDateBetween(any(), any(), any()))
                .thenReturn(Collections.singletonList(plan));
        when(recipeRepository.findById(100L)).thenReturn(Optional.of(testRecipe));

        shoppingListService.addIngredientsFromMealPlan(testUser, LocalDate.now(), LocalDate.now());

        verify(recipeRepository).findById(100L);
    }

    @Test
    void mapToCategory_Coverage() {
        // This is indirectly tested via addItem, but let's hit all branches
        String[] contents = {"Garlic", "Cheese", "Beef", "Prawn", "Chili", "Pasta", "Apple", "SomethingElse"};
        ShoppingCategory[] expected = {
                ShoppingCategory.VEGETABLES, ShoppingCategory.DAIRY, ShoppingCategory.MEAT,
                ShoppingCategory.SEAFOOD, ShoppingCategory.SPICES, ShoppingCategory.GRAINS,
                ShoppingCategory.FRUITS, ShoppingCategory.OTHER
        };

        for (int i = 0; i < contents.length; i++) {
            when(shoppingListItemRepository.findByUserAndNameAndUnitAndPurchased(any(), anyString(), anyString(), anyBoolean()))
                    .thenReturn(Optional.empty());
            when(shoppingListItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            ShoppingListItem item = shoppingListService.addItem(testUser, contents[i], "1", "unit", null);
            assertEquals(expected[i], item.getCategory(), "Failed for " + contents[i]);
        }
    }
}
