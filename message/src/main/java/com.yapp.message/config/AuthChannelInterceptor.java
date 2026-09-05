package com.yapp.message.config;

import com.yapp.message.exception.TokenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AuthChannelInterceptor implements ChannelInterceptor {
    private final RestClient restClient;

    @Value("${auth.service.url}")
    private String authServiceUrl;

    public AuthChannelInterceptor(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.
                                            getAccessor(message, StompHeaderAccessor.class);

        if(StompCommand.CONNECT.equals(accessor.getCommand())) {

            try {
                String header = accessor.getFirstNativeHeader("Authorization");
                Long userId = restClient.get()
                        .uri(authServiceUrl + "/api/auth/validate")
                        .header("Authorization", header)
                        .retrieve()
                        .body(Long.class);
                accessor.setUser(new StompPrincipal(String.valueOf(userId)));

            }catch (Exception e) {
                throw new TokenException(e.getMessage());
            }

        }

        return message;
    }
}
