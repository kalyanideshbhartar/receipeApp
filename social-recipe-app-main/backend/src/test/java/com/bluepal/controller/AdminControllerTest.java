package com.bluepal.controller;

import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.service.interfaces.AdminService;
import com.bluepal.service.interfaces.RecipeService;
import com.bluepal.repository.CommentRepository;
import com.bluepal.security.CustomUserDetailsService;
import com.bluepal.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RecipeService recipeService;

    @MockBean
    private RecipeRepository recipeRepository;

    @MockBean
    private AdminService adminService;

    @MockBean
    private CommentRepository commentRepository;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllUsers_Success() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of(new User()));
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    void updateUserRoles_Success() throws Exception {
        User user = User.builder().username("test").roles(new HashSet<>(List.of("ROLE_USER"))).build();
        Map<String, List<String>> body = Map.of("roles", List.of("ROLE_USER", "ROLE_MODERATOR"));

        when(userRepository.findByUsername("test")).thenReturn(Optional.of(user));

        mockMvc.perform(patch("/api/admin/users/test/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User roles updated successfully"));

        verify(userRepository).save(user);
    }

    @Test
    void updateUserRoles_RevokeAdmin_BadRequest() throws Exception {
        User admin = User.builder().username("admin").roles(new HashSet<>(List.of("ROLE_USER", "ROLE_ADMIN"))).build();
        Map<String, List<String>> body = Map.of("roles", List.of("ROLE_USER"));

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        mockMvc.perform(patch("/api/admin/users/admin/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Error: Cannot revoke administrative privileges."));
    }

    @Test
    void getPlatformStats_Success() throws Exception {
        when(userRepository.count()).thenReturn(10L);
        when(recipeRepository.count()).thenReturn(50L);

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(10))
                .andExpect(jsonPath("$.totalRecipes").value(50));
    }

    @Test
    void toggleRecipePremium_Success() throws Exception {
        com.bluepal.entity.Recipe recipe = com.bluepal.entity.Recipe.builder().id(1L).isPremium(false).build();
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));

        mockMvc.perform(patch("/api/admin/recipes/1/premium"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Recipe premium status toggled to: true"));

        verify(recipeRepository).save(recipe);
    }

    @Test
    void deleteRecipe_Success() throws Exception {
        mockMvc.perform(delete("/api/admin/recipes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Recipe deleted successfully"));

        verify(recipeService).deleteRecipe(1L, "admin");
    }

    @Test
    void toggleUserRestriction_Success() throws Exception {
        User user = User.builder().username("testuser").restricted(false).build();
        java.security.Principal principal = mock(java.security.Principal.class);
        when(principal.getName()).thenReturn("adminuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        mockMvc.perform(patch("/api/admin/users/testuser/restrict").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User restricted status toggled to: true"));

        verify(adminService).restrictUser("testuser", true, "adminuser");
    }

    @Test
    void mergeUsers_Success() throws Exception {
        Map<String, String> request = Map.of("sourceUsername", "user1", "targetUsername", "user2");
        java.security.Principal principal = mock(java.security.Principal.class);
        when(principal.getName()).thenReturn("adminuser");

        mockMvc.perform(post("/api/admin/users/merge")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Users merged successfully: user1 -> user2"));

        verify(adminService).mergeUsers("user1", "user2", "adminuser");
    }

    @Test
    void updatePremiumStatus_Success() throws Exception {
        Map<String, Object> body = Map.of("isPremium", true, "durationDays", 30);
        java.security.Principal principal = mock(java.security.Principal.class);
        when(principal.getName()).thenReturn("adminuser");

        mockMvc.perform(patch("/api/admin/users/testuser/premium-override")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User premium status updated manually"));

        verify(adminService).updatePremiumStatus("testuser", true, 30, "adminuser");
    }

    @Test
    void getAuditLogs_Success() throws Exception {
        when(adminService.getAuditLogs()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(status().isOk());
    }
}
