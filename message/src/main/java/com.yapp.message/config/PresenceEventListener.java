package com.yapp.message.config;

import com.yapp.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
@RequiredArgsConstructor
public class PresenceEventListener {

    private final RestClient restClient;
    @Value("${presence.service.url}")
    private String presenceServiceUrl;
    private final MessageService messageService;

    @EventListener
    public void onConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        Long userId = Long.parseLong(principal.getName());

        messageService.messageStatusDelivered(userId);

        restClient.post()
                .uri(presenceServiceUrl + "/api/presence/online/" + userId)
                .retrieve()
                .toBodilessEntity();


    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal == null) {
            return;
        }
        Long userId = Long.parseLong(principal.getName());
        restClient.post()
                .uri(presenceServiceUrl + "/api/presence/offline/" + userId)
                .retrieve()
                .toBodilessEntity();


    }
}
