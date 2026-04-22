package com.bluepal.service.impl;

import com.bluepal.entity.AuditLog;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private LikeRepository likeRepository;
    @Mock
    private BookmarkRepository bookmarkRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private RatingRepository ratingRepository;
    @Mock
    private FollowRepository followRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private EmailServiceImpl emailService;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User sourceUser;
    private User targetUser;

    @BeforeEach
    void setUp() {
        sourceUser = User.builder().id(1L).username("source").build();
        targetUser = User.builder().id(2L).username("target").build();
    }

    @Test
    void mergeUsers_Success() {
        when(userRepository.findByUsername("source")).thenReturn(Optional.of(sourceUser));
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(targetUser));
        when(recipeRepository.findByAuthor(sourceUser)).thenReturn(List.of(new Recipe()));

        adminService.mergeUsers("source", "target", "admin");

        verify(recipeRepository).saveAll(anyList());
        verify(likeRepository).deleteDuplicateLikes(1L, 2L);
        verify(auditLogRepository).save(any(AuditLog.class));
        verify(userRepository).delete(sourceUser);
    }

    @Test
    void mergeUsers_SameUser_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> 
            adminService.mergeUsers("same", "same", "admin"));
    }

    @Test
    void updatePremiumStatus_SuccessResource() {
        when(userRepository.findByUsername("source")).thenReturn(Optional.of(sourceUser));

        adminService.updatePremiumStatus("source", true, 30, "admin");

        assertTrue(sourceUser.isPremium());
        assertNotNull(sourceUser.getPremiumExpiryDate());
        verify(userRepository).save(sourceUser);
    }

    @Test
    void restrictUser_Success() {
        when(userRepository.findByUsername("source")).thenReturn(Optional.of(sourceUser));
        sourceUser.setRoles(new HashSet<>());

        adminService.restrictUser("source", true, "admin");

        assertTrue(sourceUser.isRestricted());
        verify(emailService).sendRestrictionEmail(any(), any(), eq(true));
    }

    @Test
    void restrictUser_Admin_ThrowsException() {
        sourceUser.setRoles(new HashSet<>(Collections.singletonList("ROLE_ADMIN")));
        when(userRepository.findByUsername("source")).thenReturn(Optional.of(sourceUser));

        assertThrows(IllegalArgumentException.class, () -> 
            adminService.restrictUser("source", true, "admin"));
    }

    @Test
    void getAuditLogs_Success() {
        adminService.getAuditLogs();
        verify(auditLogRepository).findAllByOrderByTimestampDesc();
    }
}
