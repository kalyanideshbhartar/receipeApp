package com.bluepal.controller;

import com.bluepal.dto.request.UpdateProfileRequest;
import com.bluepal.dto.response.UserProfileResponse;
import com.bluepal.service.interfaces.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private com.bluepal.security.JwtUtils jwtUtils;

    @MockBean
    private com.bluepal.security.CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void getUserProfile_Success() throws Exception {
        UserProfileResponse response = new UserProfileResponse();
        response.setUsername("targetuser");
        response.setBio("Hello world");

        when(userService.getUserProfile(eq(1L), any())).thenReturn(response);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("targetuser"))
                .andExpect(jsonPath("$.bio").value("Hello world"));
    }

    @Test
    @WithMockUser(username = "currentuser")
    void followUser_Success() throws Exception {
        mockMvc.perform(post("/api/users/1/follow")
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(userService).toggleFollow("currentuser", 1L);
    }

    @Test
    @WithMockUser(username = "currentuser")
    void unfollowUser_Success() throws Exception {
        mockMvc.perform(delete("/api/users/1/unfollow")
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(userService).unfollowUser("currentuser", 1L);
    }

    @Test
    @WithMockUser(username = "currentuser")
    void updateProfile_Success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setBio("Updated bio");

        UserProfileResponse response = new UserProfileResponse();
        response.setUsername("currentuser");
        response.setBio("Updated bio");

        when(userService.updateProfile(eq("currentuser"), any())).thenReturn(response);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Updated bio"));
    }

    @Test
    void followUser_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(post("/api/users/1/follow")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}
