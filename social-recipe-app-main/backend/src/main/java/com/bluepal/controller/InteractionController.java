package com.bluepal.controller;

import com.bluepal.dto.request.CommentRequest;
import com.bluepal.dto.response.CommentResponse;
import com.bluepal.entity.Comment;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.CommentRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.repository.UserRepository;
import com.bluepal.dto.response.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import com.bluepal.security.SecurityUtils;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.http.HttpStatus;
import com.bluepal.service.interfaces.NotificationService;
import com.bluepal.service.interfaces.UserService;
import com.bluepal.service.interfaces.RecipeService;
import com.bluepal.service.impl.ModerationService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InteractionController {

    private static final String AUTH_REQUIRED = "Auth required";
    private static final String USERNAME_FIELD = "username";
    private static final String RECIPE_FIELD = "Recipe";
    private static final String LIKE_COUNT_KEY = "likeCount";
    private static final String LIKED_KEY = "liked";

    private final CommentRepository commentRepository;
    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserService userService;
    private final RecipeService recipeService;
    private final ModerationService moderationService;
    private final SimpMessagingTemplate messagingTemplate;


    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    // ─── Like / Unlike Toggle ──────────────────────────────────────────────────
    @PostMapping("/recipes/{id}/like")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable("id") Long id) {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(LIKED_KEY, false));

        Map<String, Object> result = recipeService.toggleLike(id, username);

        broadcastStats(id);

        boolean isLiked = Boolean.TRUE.equals(result.get(LIKED_KEY));
        if (isLiked) {
            User user = userRepository.findByUsername(username).orElse(null);
            Recipe recipe = recipeRepository.findById(id).orElse(null);
            if (user != null && recipe != null) {
                broadcastActivity(user.getUsername() + " liked '" + recipe.getTitle() + "'");
            }
        }

        return ResponseEntity.ok(result);
    }

    // ─── Comments ──────────────────────────────────────────────────────────────
    @PostMapping("/recipes/{id}/comments")
    @Transactional
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable("id") Long id,
            @Valid @RequestBody CommentRequest request) {

        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", USERNAME_FIELD, username));

        if (user.isRestricted()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RECIPE_FIELD, "id", id));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .user(user)
                .recipe(recipe)
                .build();

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", request.getParentId()));
            comment.setParent(parent);
        }

        Comment saved = commentRepository.save(comment);
        recipeRepository.incrementCommentCount(id);

        notificationService.createAndSendNotification(
                recipe.getAuthor(),
                user,
                com.bluepal.entity.NotificationType.COMMENT,
                recipe.getId(),
                user.getUsername() + " commented on your recipe: " + recipe.getTitle());

        userService.updateReputation(user.getUsername(), 10);

        broadcastStats(id);
        broadcastActivity(user.getUsername() + " commented on '" + recipe.getTitle() + "'");

        return ResponseEntity.ok(mapToCommentResponse(saved));
    }

    @GetMapping("/recipes/{id}/comments")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable("id") Long id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RECIPE_FIELD, "id", id));

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                commentRepository.findByRecipeAndParentIsNullOrderByCreatedAtDesc(recipe, pageable)
                        .map(this::mapToCommentResponse));
    }

    @DeleteMapping("/comments/{id}")
    @Transactional
    public ResponseEntity<Object> deleteComment(@PathVariable("id") Long id) {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse(AUTH_REQUIRED));

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", USERNAME_FIELD, username));

        boolean isAuthor = comment.getUser().getUsername().equals(username);
        boolean isModeratorOrAdmin = user.getRoles().stream().anyMatch(r -> r.equals("ROLE_ADMIN"));

        if (!isAuthor && !isModeratorOrAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Not authorized to delete this comment"));
        }

        Recipe recipe = comment.getRecipe();
        recipeRepository.decrementCommentCount(recipe.getId());

        commentRepository.delete(comment);
        broadcastStats(recipe.getId());
        return ResponseEntity.ok(new MessageResponse("Comment deleted successfully"));
    }

    @PostMapping("/reports")
    public ResponseEntity<MessageResponse> reportContent(@RequestBody Map<String, Object> request) {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse(AUTH_REQUIRED));

        User reporter = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", USERNAME_FIELD, username));

        moderationService.reportContent(
                reporter,
                (String) request.get("reason"),
                (String) request.get("targetType"),
                Long.valueOf(request.get("targetId").toString()));

        return ResponseEntity.ok(new MessageResponse("Report submitted successfully"));
    }

    private CommentResponse mapToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .username(comment.getUser().getUsername())
                .userId(comment.getUser().getId())
                .userProfilePictureUrl(comment.getUser().getProfilePictureUrl())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .createdAt(comment.getCreatedAt())
                .replies(comment.getReplies() != null
                        ? comment.getReplies().stream().map(this::mapToCommentResponse)
                                .toList()
                        : new java.util.ArrayList<>())
                .build();
    }

    private void broadcastStats(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId).orElse(null);
        if (recipe != null) {
            messagingTemplate.convertAndSend("/topic/recipes/" + recipeId + "/stats",
                    Map.of("recipeId", recipeId, LIKE_COUNT_KEY, recipe.getLikeCount(),
                            "commentCount", recipe.getCommentCount()));
        }
    }

    private void broadcastActivity(String message) {
        messagingTemplate.convertAndSend("/topic/activity",
                Map.of("message", message, "timestamp", java.time.LocalDateTime.now().toString()));
    }
}
