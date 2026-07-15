package com.yapp.presence.service;

import com.yapp.presence.dto.PresenceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PresenceService {
    private final StringRedisTemplate redisTemplate;

    public void setOnline(Long userId){
        redisTemplate.opsForValue().set("presence:online:" + userId, "true");
    }

    public void setOffline(Long userId){
        redisTemplate.delete("presence:online:" + userId);
        redisTemplate.opsForValue().set("presence:lastseen:" + userId, LocalDateTime.now().toString());
    }

    public PresenceDTO getStatus(Long userId){
        Boolean online = redisTemplate.hasKey("presence:online:" + userId);
        String lastSeen = redisTemplate.opsForValue().get("presence:lastseen:" + userId);

         PresenceDTO presenceDTO = PresenceDTO.builder()
                .online(online)
                .lastSeen(lastSeen)
                .userId(userId)
                .build();

         return presenceDTO;
    }


}
