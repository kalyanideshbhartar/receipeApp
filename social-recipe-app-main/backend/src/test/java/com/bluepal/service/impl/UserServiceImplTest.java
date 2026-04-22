package com.bluepal.service.impl;

import com.bluepal.dto.request.UpdateProfileRequest;
import com.bluepal.dto.response.UserProfileResponse;
import com.bluepal.entity.Follow;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.FollowRepository;
import com.bluepal.repository.RecipeRepository;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private User targetUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setReputationPoints(100);

        targetUser = new User();
        targetUser.setId(2L);
        targetUser.setUsername("targetuser");
        targetUser.setReputationPoints(200);
    }

    @Test
    void getUserProfileByUsername_Success() {
        when(userRepository.findByUsernameIgnoreCase("targetuser")).thenReturn(Optional.of(targetUser));
        when(recipeRepository.countByAuthor(targetUser)).thenReturn(5L);
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));
        when(followRepository.existsByFollowerAndFollowing(testUser, targetUser)).thenReturn(true);

        UserProfileResponse response = userService.getUserProfile("targetuser", "testuser");

        assertNotNull(response);
        assertEquals("targetuser", response.getUsername());
        assertTrue(response.getIsFollowing());
        assertEquals(5, response.getRecipeCount());
    }

    @Test
    void getUserProfileById_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        
        UserProfileResponse response = userService.getUserProfile(2L, null);

        assertNotNull(response);
        assertEquals("targetuser", response.getUsername());
        assertFalse(response.getIsFollowing());
    }

    @Test
    void getUserProfile_UserNotFound() {
        when(userRepository.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.getUserProfile("nonexistent", null));
    }

    @Test
    void followUser_Success() {
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.findByUsernameIgnoreCase("targetuser")).thenReturn(Optional.of(targetUser));
        when(followRepository.existsByFollowerAndFollowing(testUser, targetUser)).thenReturn(false);

        userService.followUser("testuser", "targetuser");

        verify(followRepository).save(any(Follow.class));
        assertEquals(1, targetUser.getFollowerCount());
        assertEquals(1, testUser.getFollowingCount());
    }

    @Test
    void followUser_SelfFollow_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> userService.followUser("user1", "user1"));
    }

    @Test
    void unfollowUser_Success() {
        when(userRepository.findByUsernameIgnoreCase("targetuser")).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));
        Follow follow = new Follow();
        when(followRepository.findByFollowerAndFollowing(testUser, targetUser)).thenReturn(Optional.of(follow));

        testUser.setFollowingCount(1);
        targetUser.setFollowerCount(1);

        userService.unfollowUser("testuser", "targetuser");

        verify(followRepository).delete(follow);
        assertEquals(0, targetUser.getFollowerCount());
        assertEquals(0, testUser.getFollowingCount());
    }

    @Test
    void toggleFollow_Unfollow() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));
        Follow existingFollow = new Follow();
        when(followRepository.findByFollowerAndFollowing(testUser, targetUser)).thenReturn(Optional.of(existingFollow));
        
        targetUser.setFollowerCount(1);

        userService.toggleFollow("testuser", 2L);

        verify(followRepository).delete(existingFollow);
        assertEquals(0, targetUser.getFollowerCount());
    }

    @Test
    void toggleFollow_Follow() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));
        when(followRepository.findByFollowerAndFollowing(testUser, targetUser)).thenReturn(Optional.empty());

        userService.toggleFollow("testuser", 2L);

        verify(followRepository).save(any(Follow.class));
        verify(notificationService).createAndSendNotification(eq(targetUser), eq(testUser), any(), any(), anyString());
        assertEquals(1, targetUser.getFollowerCount());
    }

    @Test
    void updateProfile_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setBio("New Bio");
        request.setProfilePictureUrl("new-pfp");

        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);

        UserProfileResponse response = userService.updateProfile("testuser", request);

        assertEquals("New Bio", testUser.getBio());
        assertEquals("new-pfp", testUser.getProfilePictureUrl());
        assertEquals("New Bio", response.getBio());
    }

    @Test
    void updateReputation_Thresholds() {
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));

        // Michelin Star
        userService.updateReputation("testuser", 5000);
        assertEquals("Michelin Star Chef", testUser.getReputationLevel());
        assertTrue(testUser.isVerified());

        // Executive Chef
        testUser.setReputationPoints(1500);
        userService.updateReputation("testuser", 500);
        assertEquals("Executive Chef", testUser.getReputationLevel());

        // Sous Chef
        testUser.setReputationPoints(800);
        userService.updateReputation("testuser", 200);
        assertEquals("Sous Chef", testUser.getReputationLevel());

        // Chef de Partie
        testUser.setReputationPoints(400);
        userService.updateReputation("testuser", 100);
        assertEquals("Chef de Partie", testUser.getReputationLevel());

        // Commis Chef
        testUser.setReputationPoints(100);
        userService.updateReputation("testuser", 50);
        assertEquals("Commis Chef", testUser.getReputationLevel());
    }

    @Test
    void getFollowers_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        Follow follow = Follow.builder().follower(testUser).following(targetUser).build();
        when(followRepository.findByFollowing(targetUser)).thenReturn(Collections.singletonList(follow));

        java.util.List<UserProfileResponse> followers = userService.getFollowers(2L, null);

        assertFalse(followers.isEmpty());
        assertEquals("testuser", followers.get(0).getUsername());
    }

    @Test
    void getFollowing_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        Follow follow = Follow.builder().follower(testUser).following(targetUser).build();
        when(followRepository.findByFollower(testUser)).thenReturn(Collections.singletonList(follow));

        java.util.List<UserProfileResponse> following = userService.getFollowing(1L, null);

        assertFalse(following.isEmpty());
        assertEquals("targetuser", following.get(0).getUsername());
    }
}
