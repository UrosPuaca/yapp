package com.yapp.gateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
@Component
@RequiredArgsConstructor
public class JwtFilter implements GlobalFilter {

    private final WebClient webClient;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String request = exchange.getRequest().getPath().toString();
        if(request.startsWith("/api/auth/")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return webClient.get()
                .uri("http://localhost:8080/api/auth/validate")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(Long.class)
                .flatMap(userId -> {
                    ServerHttpRequest req = exchange.getRequest()
                            .mutate()
                            .header("X-User-Id", String.valueOf(userId))
                            .build();

                    return chain.filter(exchange.mutate().request(req).build());
                })
                .onErrorResume(e -> {
                    System.out.println("FILTER GRESKA: " + e.getMessage());
                    e.printStackTrace();
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                });
    }
}
