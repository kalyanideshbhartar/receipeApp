package com.bluepal.controller;

import com.bluepal.dto.response.MessageResponse;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.bluepal.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/recipes/{id}/rating")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final UserRepository userRepository;

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    @PostMapping
    public ResponseEntity<MessageResponse> rateRecipe(@PathVariable("id") Long id, @RequestBody Map<String, Integer> body) {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();

        Integer rating = body.get("rating");
        if (rating == null) return ResponseEntity.badRequest().body(new com.bluepal.dto.response.MessageResponse("Rating is required"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        ratingService.rateRecipe(user, id, rating);
        return ResponseEntity.ok(new com.bluepal.dto.response.MessageResponse("Recipe rated successfully"));
    }
}
