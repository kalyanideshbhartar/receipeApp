package com.bluepal.controller;

import com.bluepal.dto.request.MealPlanRequest;
import com.bluepal.dto.response.MealPlanResponse;
import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.MealPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import com.bluepal.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meal-planner")
@RequiredArgsConstructor
public class MealPlanController {

    private static final String USER_NOT_FOUND_MSG = "User not found";

    private final MealPlanService mealPlanService;
    private final UserRepository userRepository;

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    @PostMapping
    public ResponseEntity<MealPlanResponse> addMealPlan(@RequestBody MealPlanRequest request) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));
        
        return ResponseEntity.ok(mealPlanService.addMealPlan(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MealPlanResponse> updateMealPlan(
            @PathVariable Long id,
            @RequestBody MealPlanRequest request) {
        
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));
        
        return ResponseEntity.ok(mealPlanService.updateMealPlan(id, request, user));
    }

    @GetMapping
    public ResponseEntity<List<MealPlanResponse>> getMealPlans(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));
        
        return ResponseEntity.ok(mealPlanService.getMealPlans(user, startDate, endDate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMealPlan(@PathVariable Long id) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));
        
        mealPlanService.deleteMealPlan(id, user);
        return ResponseEntity.noContent().build();
    }
}
