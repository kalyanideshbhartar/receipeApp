package com.bluepal.dto;

import com.bluepal.dto.request.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthValidationTest {

    private static Validator validator;

    @BeforeAll
    public static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("Chef_Explorer");
        request.setEmail("chef@example.com");
        request.setPassword("Password@123");
        request.setFullName("Full Name");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Should have no violations");
    }

    @Test
    void testInvalidUsername_StartsWithNumber() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("123Chef");
        request.setEmail("chef@example.com");
        request.setPassword("Password@123");
        request.setFullName("Full Name");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Should have violations for username starting with number");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    void testInvalidUsername_TooShort() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("ch");
        request.setEmail("chef@example.com");
        request.setPassword("Password@123");
        request.setFullName("Full Name");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Should have violations for short username");
    }

    @Test
    void testInvalidEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("Chef_123");
        request.setEmail("invalid-email");
        request.setPassword("Password@123");
        request.setFullName("Full Name");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Should have violations for invalid email");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testInvalidPassword_NoSpecialChar() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("Chef_123");
        request.setEmail("chef@example.com");
        request.setPassword("Password123");
        request.setFullName("Full Name");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Should have violations for simple password");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }
}
