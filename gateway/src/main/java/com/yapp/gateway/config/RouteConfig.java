package com.yapp.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {
    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth", r -> r.path("/api/auth/**")
                        .uri("http://localhost:8080"))
                .route("message", r -> r.path("/api/message/**", ("/api/conversation/**"))
                        .uri("http://localhost:8081"))
                .route("websocket", r -> r.path("/end-point/**")
                        .uri("ws://localhost:8081"))
                .route("media", r -> r.path("/api/media/**")
                        .uri("http://localhost:8082"))
                .route("presence", r -> r.path("/api/presence/**")
                        .uri("http://localhost:8083"))
                .build();
    }

}
