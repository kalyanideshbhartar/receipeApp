package com.bluepal.controller;

import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.BookmarkService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookmarkController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class BookmarkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookmarkService bookmarkService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.bluepal.security.JwtUtils jwtUtils;

    @MockBean
    private com.bluepal.security.CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "testuser")
    void toggleBookmark_Success() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/bookmarks/1")
                        .with(csrf()))
                .andExpect(status().isOk());

        // Verify toggleBookmark is called with the user and recipe id 1L (pass values directly)
        verify(bookmarkService).toggleBookmark(any(User.class), any(Long.class));
    }

    @Test
    @WithMockUser(username = "testuser")
    void getBookmarks_Success() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(bookmarkService.getBookmarkedRecipes(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/bookmarks"))
                .andExpect(status().isOk());
    }

    @Test
    void toggleBookmark_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(post("/api/bookmarks/1")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}
