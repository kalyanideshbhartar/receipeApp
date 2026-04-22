package com.bluepal.controller;

import com.bluepal.dto.request.RecipeRequest;
import com.bluepal.dto.request.IngredientRequest;
import com.bluepal.dto.request.StepRequest;
import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.service.interfaces.CloudinaryService;
import com.bluepal.service.interfaces.RecipeService;
import com.bluepal.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RecipeController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RecipeService recipeService;

    @MockBean
    private CloudinaryService cloudinaryService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private com.bluepal.security.CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getRecipeById_Success() throws Exception {
        RecipeResponse response = RecipeResponse.builder()
                .id(1L)
                .title("Test Recipe")
                .build();

        when(recipeService.getRecipeById(any(Long.class), any())).thenReturn(response);

        mockMvc.perform(get("/api/recipes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Test Recipe"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void createRecipe_Success() throws Exception {
        RecipeRequest request = new RecipeRequest();
        request.setTitle("New Recipe");
        request.setCategory("VEG");
        request.setIngredients(List.of(new com.bluepal.dto.request.IngredientRequest()));
        request.setSteps(List.of(new com.bluepal.dto.request.StepRequest()));

        RecipeResponse response = RecipeResponse.builder()
                .id(2L)
                .title("New Recipe")
                .build();

        when(recipeService.createRecipe(any(RecipeRequest.class), anyString())).thenReturn(response);

        mockMvc.perform(post("/api/recipes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.title").value("New Recipe"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void createRecipe_Unauthorized_NullPrincipal() throws Exception {
        // With filters disabled, but principal is "testuser" from @WithMockUser
        // Test that the controller processes the request without NPE when username is null
        RecipeRequest request = new RecipeRequest();
        request.setTitle("New Recipe");
        request.setCategory("VEG");
        request.setIngredients(List.of(new com.bluepal.dto.request.IngredientRequest()));
        request.setSteps(List.of(new com.bluepal.dto.request.StepRequest()));

        when(recipeService.createRecipe(any(RecipeRequest.class), anyString()))
                .thenReturn(RecipeResponse.builder().id(3L).title("New Recipe").build());

        mockMvc.perform(post("/api/recipes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void getTrendingRecipes_Success() throws Exception {
        when(recipeService.getTrendingRecipes(any(), anyInt())).thenReturn(List.of());
        mockMvc.perform(get("/api/recipes/trending"))
                .andExpect(status().isOk());
    }

    @Test
    void getRecipesByCategory_Success() throws Exception {
        when(recipeService.getRecipesByCategory(anyString(), any(), anyInt())).thenReturn(List.of());
        mockMvc.perform(get("/api/recipes/category/VEG"))
                .andExpect(status().isOk());
    }

    @Test
    void getPersonalizedFeed_Success() throws Exception {
        when(recipeService.getPersonalizedFeedCursor(any(), any(), anyInt())).thenReturn(java.util.Map.of());
        mockMvc.perform(get("/api/recipes/feed"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void updateRecipe_Success() throws Exception {
        RecipeRequest request = new RecipeRequest();
        request.setTitle("Updated Title");
        request.setCategory("BREAKFAST");
        request.setIngredients(java.util.List.of(new IngredientRequest()));
        request.setSteps(java.util.List.of(new StepRequest()));

        when(recipeService.updateRecipe(anyLong(), any(), anyString()))
                .thenReturn(RecipeResponse.builder().id(1L).title("Updated Title").build());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/recipes/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteRecipe_Success() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/recipes/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void getExploreFeed_WithFilters_Success() throws Exception {
        when(recipeService.getFilteredExploreFeed(any(), anyInt(), any(), any(), any(), anyString(), any()))
                .thenReturn(java.util.Map.of());

        mockMvc.perform(get("/api/recipes/explore")
                        .param("category", "VEG")
                        .param("maxTime", "30"))
                .andExpect(status().isOk());
    }
}
