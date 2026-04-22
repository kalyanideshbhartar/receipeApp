package com.bluepal.service.interfaces;

import com.bluepal.dto.response.UserProfileResponse;

public interface UserService {
    UserProfileResponse getUserProfile(String username, String currentUsername);
    UserProfileResponse getUserProfile(Long id, String currentUsername);
    void followUser(String followerUsername, String followingUsername);
    void unfollowUser(String followerUsername, String followingUsername);
    void unfollowUser(String followerUsername, Long followingId);
    UserProfileResponse updateProfile(String username, com.bluepal.dto.request.UpdateProfileRequest request);
    void updateReputation(String username, int points);
    // Added for Toggle Logic
    void toggleFollow(String followerUsername, String followingUsername);
    void toggleFollow(String followerUsername, Long followingId);
    java.util.List<UserProfileResponse> getFollowers(Long userId, String currentUsername);
    java.util.List<UserProfileResponse> getFollowing(Long userId, String currentUsername);
}