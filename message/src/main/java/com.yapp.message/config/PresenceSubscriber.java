package com.yapp.message.config;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PresenceSubscriber implements MessageListener {
    private final SimpMessagingTemplate simpMessagingTemplate;

    @Override
    public void onMessage(org.springframework.data.redis.connection.Message message, byte @Nullable [] pattern) {
        String onlineUser = new String(message.getBody());
        simpMessagingTemplate.convertAndSend("/topic/online", onlineUser);


    }
}
