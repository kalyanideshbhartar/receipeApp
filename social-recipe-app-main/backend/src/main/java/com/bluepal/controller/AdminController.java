package com.bluepal.controller;

import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.dto.response.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final com.bluepal.service.interfaces.RecipeService recipeService;
    private final com.bluepal.repository.RecipeRepository recipeRepository;
    private final com.bluepal.service.interfaces.AdminService adminService;

    public AdminController(UserRepository userRepository, 
                           com.bluepal.service.interfaces.RecipeService recipeService,
                           com.bluepal.repository.RecipeRepository recipeRepository,
                           com.bluepal.service.interfaces.AdminService adminService) {
        this.userRepository = userRepository;
        this.recipeService = recipeService;
        this.recipeRepository = recipeRepository;
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{username}/roles")
    public ResponseEntity<Object> updateUserRoles(@PathVariable String username, @RequestBody Map<String, List<String>> body) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        List<String> newRoles = body.get("roles");
        if (newRoles != null) {
            // SECURITY CHECK: Cannot revoke ADMIN role
            if (user.getRoles().contains("ROLE_ADMIN") && !newRoles.contains("ROLE_ADMIN")) {
                return ResponseEntity.badRequest().body("Error: Cannot revoke administrative privileges.");
            }

            user.getRoles().clear();
            user.getRoles().addAll(newRoles);
            userRepository.save(user);
        }
        return ResponseEntity.ok(new MessageResponse("User roles updated successfully"));
    }


    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getPlatformStats() {
        return ResponseEntity.ok(Map.of(
            "totalUsers", userRepository.count(),
            "totalRecipes", recipeRepository.count()
        ));
    }

    @PatchMapping("/recipes/{id}/premium")
    public ResponseEntity<MessageResponse> toggleRecipePremium(@PathVariable Long id) {
        com.bluepal.entity.Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", "id", id));
        recipe.setPremium(!recipe.isPremium());
        recipeRepository.save(recipe);
        return ResponseEntity.ok(new MessageResponse("Recipe premium status toggled to: " + recipe.isPremium()));
    }

    @GetMapping("/recipes")
    public ResponseEntity<java.util.List<com.bluepal.dto.response.RecipeResponse>> getAllRecipes() {
        return ResponseEntity.ok(recipeRepository.findAll().stream()
                .map(r -> recipeService.mapToResponse(r, "admin")) // Use a system-level or admin username for context
                .toList());
    }


    @DeleteMapping("/recipes/{id}")
    public ResponseEntity<MessageResponse> deleteRecipe(@PathVariable Long id) {
        recipeService.deleteRecipe(id, "admin"); // Assuming admin can delete any recipe
        return ResponseEntity.ok(new MessageResponse("Recipe deleted successfully"));
    }

    @PatchMapping("/users/{username}/restrict")
    public ResponseEntity<MessageResponse> toggleUserRestriction(@PathVariable String username, java.security.Principal principal) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        boolean newStatus = !user.isRestricted();
        adminService.restrictUser(username, newStatus, principal.getName());
        return ResponseEntity.ok(new MessageResponse("User restricted status toggled to: " + newStatus));
    }

    @PostMapping("/users/merge")
    public ResponseEntity<MessageResponse> mergeUsers(@RequestBody Map<String, String> request, java.security.Principal principal) {
        String source = request.get("sourceUsername");
        String target = request.get("targetUsername");
        adminService.mergeUsers(source, target, principal.getName());
        return ResponseEntity.ok(new MessageResponse("Users merged successfully: " + source + " -> " + target));
    }

    @PatchMapping("/users/{username}/premium-override")
    public ResponseEntity<MessageResponse> updatePremiumStatus(@PathVariable String username, @RequestBody Map<String, Object> body, java.security.Principal principal) {
        boolean isPremium = (boolean) body.getOrDefault("isPremium", true);
        Integer duration = (Integer) body.get("durationDays");
        adminService.updatePremiumStatus(username, isPremium, duration, principal.getName());
        return ResponseEntity.ok(new MessageResponse("User premium status updated manually"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<com.bluepal.entity.AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }
}
