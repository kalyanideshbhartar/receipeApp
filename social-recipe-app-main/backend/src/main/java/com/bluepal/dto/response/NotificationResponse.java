package com.bluepal.dto.response;

import com.bluepal.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String senderUsername;
    private Long senderUserId;
    private String senderProfilePictureUrl;
    private NotificationType type;
    private Long recipeId;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
