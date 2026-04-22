package com.bluepal;

import com.bluepal.repository.CategoryRepository;
import com.bluepal.repository.RecipeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DebugDataScanner implements CommandLineRunner {
    private final CategoryRepository categoryRepository;
    private final RecipeRepository recipeRepository;

    public DebugDataScanner(CategoryRepository categoryRepository, RecipeRepository recipeRepository) {
        this.categoryRepository = categoryRepository;
        this.recipeRepository = recipeRepository;
    }

    @Override
    public void run(String... args) {
        log.info("----- DEBUG CATEGORIES -----");
        categoryRepository.findAll().forEach(cat -> 
            log.info("ID: {} | Name: [{}]", cat.getId(), cat.getName())
        );
        
        log.info("----- DEBUG RECIPES -----");
        recipeRepository.findAll().forEach(r -> 
            log.info("Title: [{}] | Category: [{}] | CatID: {}", 
                r.getTitle(), 
                (r.getCategory() != null ? r.getCategory().getName() : "NULL"), 
                (r.getCategory() != null ? r.getCategory().getId() : "NULL"))
        );
    }
}
