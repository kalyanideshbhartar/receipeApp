package com.bluepal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RealTimeChefService {

    private final SimpMessagingTemplate messagingTemplate;
    
    // Map of Recipe ID -> Set of Session IDs
    private final Map<Long, java.util.Set<String>> recipeViewers = new ConcurrentHashMap<>();
    
    // Map of Session ID -> Recipe ID (to handle disconnects)
    private final Map<String, Long> sessionTracking = new ConcurrentHashMap<>();

    private static final String TOPIC_RECIPES_PREFIX = "/topic/recipes/";

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        String sessionId = headerAccessor.getSessionId();

        if (destination != null && destination.startsWith(TOPIC_RECIPES_PREFIX) && destination.endsWith("/stats")) {
            try {
                // Extract Recipe ID from /topic/recipes/{id}/stats
                String idStr = destination.replace(TOPIC_RECIPES_PREFIX, "").replace("/stats", "");
                Long recipeId = Long.parseLong(idStr);
                
                recipeViewers.computeIfAbsent(recipeId, k -> java.util.concurrent.ConcurrentHashMap.newKeySet()).add(sessionId);
                sessionTracking.put(sessionId, recipeId);
                
                broadcastViewerCount(recipeId);
            } catch (Exception e) {
                // Ignore parsing errors
            }
        }
    }

    @EventListener
    public void handleUnsubscribeEvent(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        removeSession(headerAccessor.getSessionId());
    }

    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        removeSession(event.getSessionId());
    }

    private void removeSession(String sessionId) {
        Long recipeId = sessionTracking.remove(sessionId);
        if (recipeId != null) {
            java.util.Set<String> viewers = recipeViewers.get(recipeId);
            if (viewers != null) {
                viewers.remove(sessionId);
                broadcastViewerCount(recipeId);
            }
        }
    }

    private void broadcastViewerCount(Long recipeId) {
        int count = recipeViewers.getOrDefault(recipeId, java.util.Collections.emptySet()).size();
        messagingTemplate.convertAndSend(TOPIC_RECIPES_PREFIX + recipeId + "/viewers", Map.of("count", count));
    }
}
