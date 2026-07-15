package com.yapp.presence.controller;

import com.yapp.presence.dto.PresenceDTO;
import com.yapp.presence.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {
    private final PresenceService presenceService;

    @PostMapping("/online/{userId}")
    public ResponseEntity<?> setOnline(@PathVariable Long userId) {
        presenceService.setOnline(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/offline/{userId}")
    public ResponseEntity<?> setOffline(@PathVariable Long userId) {
        presenceService.setOffline(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<?> getStatus(@PathVariable Long userId) {
        PresenceDTO presenceDTO = presenceService.getStatus(userId);
        return ResponseEntity.ok(presenceDTO);
    }



}
