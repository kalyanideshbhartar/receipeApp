package com.bluepal.controller;

import com.bluepal.dto.request.MealPlanRequest;
import com.bluepal.dto.response.MealPlanResponse;
import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.MealPlanService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MealPlanController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class MealPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MealPlanService mealPlanService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.bluepal.security.JwtUtils jwtUtils;

    @MockBean
    private com.bluepal.security.CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "testuser")
    void addMealPlan_Success() throws Exception {
        User mockUser = new User();
        mockUser.setUsername("testuser");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(mockUser));
        when(mealPlanService.addMealPlan(any(), any())).thenReturn(MealPlanResponse.builder().build());

        MealPlanRequest request = new MealPlanRequest();
        request.setRecipeId(1L);
        request.setPlannedDate(LocalDate.now());

        mockMvc.perform(post("/api/meal-planner")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void getMealPlans_Success() throws Exception {
        User mockUser = new User();
        mockUser.setUsername("testuser");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(mockUser));
        when(mealPlanService.getMealPlans(any(), any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/meal-planner")
                        .param("startDate", "2026-03-20")
                        .param("endDate", "2026-03-27"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteMealPlan_Success() throws Exception {
        User mockUser = new User();
        mockUser.setUsername("testuser");
        when(userRepository.findByUsername(any())).thenReturn(Optional.of(mockUser));
        when(mealPlanService.getMealPlans(any(), any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(delete("/api/meal-planner/1")
                        .with(csrf())
                        .with(user("testuser")))
                .andDo(print())
                .andExpect(status().isNoContent());

        // Pass values directly instead of wrapping in eq()
        verify(mealPlanService).deleteMealPlan(1L, mockUser);
    }
}
