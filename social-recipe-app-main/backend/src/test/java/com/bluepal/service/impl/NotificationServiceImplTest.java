package com.bluepal.service.impl;

import com.bluepal.dto.response.NotificationResponse;
import com.bluepal.entity.Notification;
import com.bluepal.entity.User;
import com.bluepal.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setUsername("testuser");
    }

    @Test
    void getNotifications_Success() {
        when(notificationRepository.findByRecipientOrderByCreatedAtDesc(any(), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<NotificationResponse> response = notificationService.getNotifications(mockUser, PageRequest.of(0, 10));
        assertNotNull(response);
        assertTrue(response.getContent().isEmpty());
    }

    @Test
    void getUnreadCount_Success() {
        when(notificationRepository.countByRecipientAndRead(mockUser, false)).thenReturn(5L);

        long count = notificationService.getUnreadCount(mockUser);
        assertEquals(5L, count);
    }

    @Test
    void markAsRead_Unauthorized_ThrowsException() {
        User otherUser = new User();
        otherUser.setUsername("other");

        Notification notification = new Notification();
        notification.setId(1L);
        notification.setRecipient(otherUser);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> 
            notificationService.markAsRead(1L, "testuser")
        );
    }

    @Test
    void markAsRead_NotFound_ThrowsException() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(com.bluepal.exception.ResourceNotFoundException.class, () -> 
            notificationService.markAsRead(1L, "testuser")
        );
    }

    @Test
    void markAllAsRead_Empty_Success() {
        when(notificationRepository.findByRecipientAndReadOrderByCreatedAtDesc(mockUser, false)).thenReturn(Collections.emptyList());

        notificationService.markAllAsRead(mockUser);

        verify(notificationRepository).saveAll(Collections.emptyList());
    }

    @Test
    void mapToResponse_SystemNotification_Success() {
        Notification notification = new Notification();
        notification.setSender(null); // System
        notification.setMessage("Update available");

        when(notificationRepository.findByRecipientOrderByCreatedAtDesc(any(), any()))
                .thenReturn(new PageImpl<>(List.of(notification)));

        Page<NotificationResponse> response = notificationService.getNotifications(mockUser, PageRequest.of(0, 10));
        
        assertEquals("System", response.getContent().get(0).getSenderUsername());
        assertNull(response.getContent().get(0).getSenderUserId());
    }

    @Test
    void createAndSendNotification_Success() {
        User recipient = new User();
        recipient.setId(2L);
        recipient.setUsername("recipient");
        
        User sender = new User();
        sender.setId(1L);
        sender.setUsername("sender");

        Notification mockSaved = Notification.builder()
                .id(100L)
                .recipient(recipient)
                .sender(sender)
                .type(com.bluepal.entity.NotificationType.LIKE)
                .message("Liked your recipe")
                .build();
        
        when(notificationRepository.save(any(Notification.class))).thenReturn(mockSaved);

        notificationService.createAndSendNotification(recipient, sender, com.bluepal.entity.NotificationType.LIKE, 500L, "Liked your recipe");

        verify(notificationRepository).save(any(Notification.class));
        verify(messagingTemplate).convertAndSendToUser(eq("recipient"), eq("/queue/notifications"), any());
    }

    @Test
    void createAndSendNotification_SelfNotification_Ignore() {
        User sender = new User();
        sender.setId(1L);
        sender.setUsername("sender");

        notificationService.createAndSendNotification(sender, sender, com.bluepal.entity.NotificationType.LIKE, 500L, "Liked own recipe");

        verifyNoInteractions(notificationRepository);
        verifyNoInteractions(messagingTemplate);
    }
}
