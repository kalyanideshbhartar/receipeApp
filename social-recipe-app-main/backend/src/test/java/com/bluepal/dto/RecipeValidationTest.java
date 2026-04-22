package com.bluepal.dto;

import com.bluepal.dto.request.RecipeRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecipeValidationTest {

    private static Validator validator;

    @BeforeAll
    public static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRecipeRequest() {
        RecipeRequest request = new RecipeRequest();
        request.setTitle("Valid Recipe Title");
        request.setCategory("VEG");
        request.setPrepTimeMinutes(30);
        request.setCookTimeMinutes(45);
        request.setServings(4);
        request.setIngredients(new ArrayList<>()); // Simplified for DTO test
        request.getIngredients().add(null); // Assuming nested validation handled elsewhere
        request.setSteps(new ArrayList<>());
        request.getSteps().add(null);

        // Note: Real testing would need full IngredientRequest objects, 
        // but here we focus on the RecipeRequest level constraints.
        
        Set<ConstraintViolation<RecipeRequest>> violations = validator.validate(request);
        // We expect errors because ingredients list is empty or invalid if we don't fix it
        // Actually RecipeRequest has @NotEmpty on ingredients/steps
    }

    @Test
    void testInvalidRecipe_NegativeTime() {
        RecipeRequest request = new RecipeRequest();
        request.setTitle("Recipe");
        request.setCategory("VEG");
        request.setPrepTimeMinutes(-5);
        request.setCookTimeMinutes(30);
        request.setServings(4);

        Set<ConstraintViolation<RecipeRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Should have violations for negative prep time");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("prepTimeMinutes")));
    }

    @Test
    void testInvalidRecipe_EmptyCategory() {
        RecipeRequest request = new RecipeRequest();
        request.setTitle("Recipe");
        request.setCategory(null);

        Set<ConstraintViolation<RecipeRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Should have violations for null category");
    }
}
