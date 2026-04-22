package com.bluepal.service.interfaces;

import com.bluepal.dto.response.NotificationResponse;
import com.bluepal.entity.User;
import com.bluepal.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Page<NotificationResponse> getNotifications(User user, Pageable pageable);
    long getUnreadCount(User user);
    void markAsRead(Long id, String username);
    void markAllAsRead(User user);
    void createAndSendNotification(User recipient, User sender, NotificationType type, Long recipeId, String message);
}
