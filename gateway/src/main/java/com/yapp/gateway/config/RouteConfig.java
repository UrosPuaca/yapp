package com.yapp.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Value("${presence.service.url}")
    private String presenceServiceUrl;

    @Value("${media.service.url}")
    private String mediaServiceUrl;

    @Value("${message.service.url}")
    private String messageServiceUrl;

    @Value("${auth.service.url}")
    private String authServiceUrl;





    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {

        return builder.routes()
                .route("auth", r -> r.path("/api/auth/**")
                        .uri(authServiceUrl))
                .route("user", r -> r.path("/api/user/**")
                        .uri(authServiceUrl))
                .route("message", r -> r.path("/api/message/**", ("/api/conversation/**"))
                        .uri(messageServiceUrl))
                .route("websocket", r -> r.path("/end-point/**")
                        .uri(messageServiceUrl))
                .route("media", r -> r.path("/api/media/**")
                        .uri(mediaServiceUrl))
                .route("presence", r -> r.path("/api/presence/**")
                        .uri(presenceServiceUrl))
                .build();
    }

}
