package com.yapp.message.rateLimiter;

import lombok.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

import static java.lang.Math.min;

@Component
@RequiredArgsConstructor
public class TokenBucket {

    private final StringRedisTemplate redisTemplate;

    @Value("${rateLimiter.bucketCapacity}")
    private int bucketCapacity;

    @Value("${rateLimiter.refillRate}")
    private double refillRate;


    public boolean isAllowed(Long userId){
        double lastRefill;
        double token;

        HashOperations <String, String, String> hashOps = redisTemplate.opsForHash();

        String tokenStr = hashOps.get("rateLimiter:"+userId, "token");
        if(tokenStr == null){
            token = bucketCapacity;
            hashOps.put("rateLimiter:"+userId, "token", String.valueOf(token));
            hashOps.put("rateLimiter:"+userId, "lastRefill", String.valueOf(System.currentTimeMillis()));
        }else{
            token = Double.parseDouble(tokenStr);
        }

        lastRefill = Double.parseDouble(hashOps.get("rateLimiter:"+userId, "lastRefill"));

        double passed = (System.currentTimeMillis()-lastRefill)/1000.0;

        token = min(bucketCapacity, token + passed*refillRate);




        if(token>=1){
            token--;
            hashOps.put("rateLimiter:"+userId, "token", String.valueOf(token));
            hashOps.put("rateLimiter:"+userId, "lastRefill", String.valueOf(System.currentTimeMillis()));
            redisTemplate.expire("rateLimiter:"+userId, 60, TimeUnit.SECONDS);
            return true;
        }


        hashOps.put("rateLimiter:"+userId, "token", String.valueOf(token));
        hashOps.put("rateLimiter:"+userId, "lastRefill", String.valueOf(System.currentTimeMillis()));
        redisTemplate.expire("rateLimiter:"+userId, 60, TimeUnit.SECONDS);
        return false;
    }




}
