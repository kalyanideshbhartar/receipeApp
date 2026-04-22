package com.bluepal.controller;

import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.security.SecurityUtils;
import com.bluepal.dto.response.MessageResponse;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;
    private final UserRepository userRepository;

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    @PostMapping("/{recipeId}")
    public ResponseEntity<MessageResponse> toggleBookmark(@PathVariable("recipeId") Long recipeId) {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        bookmarkService.toggleBookmark(user, recipeId);
        return ResponseEntity.ok(new MessageResponse("Bookmark status updated successfully"));
    }

    @GetMapping
    public ResponseEntity<List<RecipeResponse>> getBookmarkedRecipes() {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(401).build();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return ResponseEntity.ok(bookmarkService.getBookmarkedRecipes(user));
    }
}
