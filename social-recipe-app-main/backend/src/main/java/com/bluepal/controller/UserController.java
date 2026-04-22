package com.bluepal.controller;

import com.bluepal.dto.response.UserProfileResponse;
import com.bluepal.dto.response.MessageResponse;
import com.bluepal.service.interfaces.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.bluepal.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable("id") Long id) {
        String currentUsername = getCurrentUsername();
        UserProfileResponse response = userService.getUserProfile(id, currentUsername);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/{id}/follow")
    public ResponseEntity<MessageResponse> followUser(@PathVariable("id") Long id) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Authentication required"));
        }
        
        userService.toggleFollow(currentUsername, id);
        return ResponseEntity.ok(new MessageResponse("Follow status updated for user ID " + id));
    }
    
    

    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<MessageResponse> unfollowUser(@PathVariable("id") Long id) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Authentication required"));
        }
        
        userService.unfollowUser(currentUsername, id);
        return ResponseEntity.ok(new MessageResponse("Successfully unfollowed user ID " + id));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(@RequestBody com.bluepal.dto.request.UpdateProfileRequest request) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }
        UserProfileResponse response = userService.updateProfile(currentUsername, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<java.util.List<UserProfileResponse>> getFollowers(@PathVariable("id") Long id) {
        String currentUsername = getCurrentUsername();
        return ResponseEntity.ok(userService.getFollowers(id, currentUsername));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<java.util.List<UserProfileResponse>> getFollowing(@PathVariable("id") Long id) {
        String currentUsername = getCurrentUsername();
        return ResponseEntity.ok(userService.getFollowing(id, currentUsername));
    }
}
