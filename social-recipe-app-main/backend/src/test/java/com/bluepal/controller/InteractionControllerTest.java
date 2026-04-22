package com.bluepal.controller;

import com.bluepal.dto.request.CommentRequest;
import com.bluepal.entity.Comment;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.repository.CommentRepository;
import com.bluepal.repository.LikeRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.NotificationService;
import com.bluepal.service.interfaces.UserService;
import com.bluepal.service.interfaces.RecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(InteractionController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class InteractionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LikeRepository likeRepository;

    @MockBean
    private CommentRepository commentRepository;

    @MockBean
    private RecipeRepository recipeRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserService userService;

    @MockBean
    private RecipeService recipeService;

    @MockBean
    private com.bluepal.service.impl.ModerationService moderationService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private com.bluepal.security.JwtUtils jwtUtils;

    @MockBean
    private com.bluepal.security.CustomUserDetailsService customUserDetailsService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    private User mockUser;
    private Recipe mockRecipe;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");

        mockRecipe = new Recipe();
        mockRecipe.setId(1L);
        mockRecipe.setTitle("Test Recipe");
        mockRecipe.setAuthor(mockUser);
        mockRecipe.setLikeCount(5);
    }

    @Test
    @WithMockUser(username = "testuser")
    void toggleLike_AlreadyLiked_Unlikes() throws Exception {
        when(recipeService.toggleLike(1L, "testuser")).thenReturn(Map.of("liked", false, "likeCount", 4));

        mockMvc.perform(post("/api/recipes/1/like")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false))
                .andExpect(jsonPath("$.likeCount").value(4));

        verify(recipeService).toggleLike(1L, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void toggleLike_NotLiked_Likes() throws Exception {
        when(recipeService.toggleLike(1L, "testuser")).thenReturn(Map.of("liked", true, "likeCount", 6));

        mockMvc.perform(post("/api/recipes/1/like")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(6));

        verify(recipeService).toggleLike(1L, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void addComment_WithParent_Success() throws Exception {
        CommentRequest request = new CommentRequest();
        request.setContent("Reply!");
        request.setParentId(10L);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(mockRecipe));
        
        Comment parent = new Comment();
        parent.setId(10L);
        when(commentRepository.findById(10L)).thenReturn(Optional.of(parent));

        Comment savedComment = new Comment();
        savedComment.setId(1L);
        savedComment.setContent("Reply!");
        savedComment.setUser(mockUser);
        savedComment.setRecipe(mockRecipe);
        savedComment.setParent(parent);
        
        when(commentRepository.save(any())).thenReturn(savedComment);

        mockMvc.perform(post("/api/recipes/1/comments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentId").value(10));
    }

    @Test
    @WithMockUser(username = "restricted")
    void addComment_RestrictedUser_Forbidden() throws Exception {
        mockUser.setRestricted(true);
        when(userRepository.findByUsername("restricted")).thenReturn(Optional.of(mockUser));

        CommentRequest request = new CommentRequest();
        request.setContent("Forbidden");

        mockMvc.perform(post("/api/recipes/1/comments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getComments_Success() throws Exception {
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(mockRecipe));
        when(commentRepository.findByRecipeAndParentIsNullOrderByCreatedAtDesc(any(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/recipes/1/comments"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteComment_Author_Success() throws Exception {
        Comment comment = new Comment();
        comment.setId(1L);
        comment.setUser(mockUser);
        comment.setRecipe(mockRecipe);

        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/comments/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Comment deleted successfully"));

        verify(commentRepository).delete(comment);
    }

    @Test
    @WithMockUser(username = "testuser")
    void reportContent_Success() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        
        java.util.Map<String, Object> request = java.util.Map.of(
            "reason", "Spam",
            "targetType", "RECIPE",
            "targetId", 1
        );

        mockMvc.perform(post("/api/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Report submitted successfully"));

        verify(moderationService).reportContent(mockUser, "Spam", "RECIPE", 1L);
    }
}

