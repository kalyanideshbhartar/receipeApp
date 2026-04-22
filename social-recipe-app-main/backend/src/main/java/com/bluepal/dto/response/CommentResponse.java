package com.bluepal.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponse {
    private Long id;
    private String content;
    private String username;
    private Long userId;
    private String userProfilePictureUrl;
    private Long parentId;
    private LocalDateTime createdAt;
    private java.util.List<CommentResponse> replies;
}
