package com.bluepal.controller;

import com.bluepal.dto.response.NotificationResponse;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import com.bluepal.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final String USER = "User";
    private static final String USERNAME = "username";

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private String getCurrentUsername() {
        return SecurityUtils.getCurrentUsername();
    }

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(401).build();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getNotifications(user, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Object> getUnreadCount() {
        log.debug("Received request for /api/notifications/unread-count");
        String username = getCurrentUsername();
        log.debug("Current username for unread-count: {}", username);
        if (username == null) return ResponseEntity.status(401).build();

        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

            long count = notificationService.getUnreadCount(user);
            log.debug("Unread count for {} is {}", username, count);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("DEBUG ERROR in getUnreadCount: {}", e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Object> markAsRead(@PathVariable("id") Long id) {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(401).build();

        try {
            notificationService.markAsRead(id, username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<Object> markAllAsRead() {
        String username = getCurrentUsername();
        if (username == null) return ResponseEntity.status(401).build();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
}
