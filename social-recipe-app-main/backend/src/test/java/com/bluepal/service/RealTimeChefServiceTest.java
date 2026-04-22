package com.bluepal.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RealTimeChefServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private RealTimeChefService realTimeChefService;

    @Test
    @SuppressWarnings("unchecked")
    void handleSubscribeEvent_RecipeStats_Success() {
        // Build a mock message with STOMP headers
        org.springframework.messaging.Message<byte[]> message = mock(org.springframework.messaging.Message.class);
        org.springframework.messaging.MessageHeaders headers = new org.springframework.messaging.MessageHeaders(
            Map.of(
                "simpDestination", "/topic/recipes/100/stats",
                "simpSessionId", "sess1"
            )
        );
        when(message.getHeaders()).thenReturn(headers);

        SessionSubscribeEvent event = new SessionSubscribeEvent(new Object(), message);
        
        realTimeChefService.handleSubscribeEvent(event);

        verify(messagingTemplate).convertAndSend(eq("/topic/recipes/100/viewers"), any(java.util.Map.class));
    }

    @Test
    void handleDisconnectEvent_Success() {
        // First subscribe to track the session
        org.springframework.messaging.Message<byte[]> subMessage = mock(org.springframework.messaging.Message.class);
        org.springframework.messaging.MessageHeaders subHeaders = new org.springframework.messaging.MessageHeaders(
            Map.of("simpDestination", "/topic/recipes/100/stats", "simpSessionId", "sess1")
        );
        when(subMessage.getHeaders()).thenReturn(subHeaders);
        realTimeChefService.handleSubscribeEvent(new SessionSubscribeEvent(new Object(), subMessage));

        // Now disconnect
        org.springframework.web.socket.messaging.SessionDisconnectEvent disconnectEvent = 
            new org.springframework.web.socket.messaging.SessionDisconnectEvent(new Object(), subMessage, "sess1", org.springframework.web.socket.CloseStatus.NORMAL);
        
        realTimeChefService.handleDisconnectEvent(disconnectEvent);

        // Should broadcast count = 0 after disconnect
        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/recipes/100/viewers"), any(java.util.Map.class));
    }
}
