package com.bluepal.config;

import com.bluepal.entity.Category;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.RecipeStatus;
import com.bluepal.entity.User;
import com.bluepal.repository.CategoryRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@culinario.com";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_USER = "ROLE_USER";

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final RecipeRepository recipeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.debug("Running DataSeeder for Admin Setup...");

        createDefaultAdmin();
        demoteOtherAdmins(ADMIN_EMAIL);
        seedCategories();
        seedSampleRecipes();

        log.debug("DataSeeder completed.");
    }

    private void demoteOtherAdmins(String mainAdminEmail) {
        userRepository.findAll().forEach(user -> {
            if (!mainAdminEmail.equalsIgnoreCase(user.getEmail()) &&
                user.getRoles().contains(ROLE_ADMIN)) {
                user.getRoles().remove(ROLE_ADMIN);
                userRepository.save(user);
                log.info("Demoted user '{}' from ADMIN role.", user.getUsername());
            }
        });
    }

    @Value("${admin.initial.password:CulinarioAdmin@2026++}")
    private String adminInitialPassword;

    private void createDefaultAdmin() {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = User.builder()
                    .username("admin")
                    .fullName("System Administrator")
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(adminInitialPassword))
                    .roles(new java.util.HashSet<>(java.util.Set.of(ROLE_USER, ROLE_ADMIN)))
                    .enabled(true)
                    .verified(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin account created ({}).", ADMIN_EMAIL);
        } else {
            userRepository.findByEmail(ADMIN_EMAIL).ifPresent(admin -> {
                if (!admin.getRoles().contains(ROLE_ADMIN)) {
                    admin.getRoles().add(ROLE_ADMIN);
                    userRepository.save(admin);
                }
            });
            log.debug("Default admin account already exists.");
        }
    }

    private void seedCategories() {
        String[] cats = {"Breakfast", "Lunch", "Dinner", "Dessert", "Healthy", "Vegan", "Italian", "Indian", "Seafood", "Baking", "Vegetarian", "Non-Vegetarian"};
        for (String catName : cats) {
            if (!categoryRepository.existsByNameIgnoreCase(catName)) {
                categoryRepository.save(new Category(catName));
            }
        }
    }

    private void seedSampleRecipes() {
        if (recipeRepository.count() < 5) {
            User admin = userRepository.findByUsername("admin").orElse(null);
            Category healthy = categoryRepository.findByNameIgnoreCase("Healthy").orElse(null);

            if (admin != null && healthy != null) {
                Recipe r1 = Recipe.builder()
                        .title("Sample Recipe 26")
                        .description("Automated seed recipe for ID 26 stabilization")
                        .author(admin)
                        .category(healthy)
                        .isPublished(true)
                        .isPremium(false)
                        .status(RecipeStatus.ACTIVE)
                        .prepTimeMinutes(10)
                        .cookTimeMinutes(20)
                        .servings(2)
                        .build();
                recipeRepository.save(r1);

                Recipe r2 = Recipe.builder()
                        .title("Sample Recipe 27")
                        .description("Automated seed recipe for ID 27 stabilization")
                        .author(admin)
                        .category(healthy)
                        .isPublished(true)
                        .isPremium(true)
                        .status(RecipeStatus.ACTIVE)
                        .prepTimeMinutes(15)
                        .cookTimeMinutes(25)
                        .servings(4)
                        .build();
                recipeRepository.save(r2);
                log.info("Sample recipes seeded.");
            }
        }
    }
}