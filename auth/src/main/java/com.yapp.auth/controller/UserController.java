package com.yapp.auth.controller;

import com.yapp.auth.dto.AvatarRequestDTO;
import com.yapp.auth.dto.PublicUserResponseDTO;
import com.yapp.auth.dto.UserResponseDTO;
import com.yapp.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("X-User-Id") Long userId) {
        UserResponseDTO userResponseDTO = userService.getMe(userId);
        return ResponseEntity.ok(userResponseDTO);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Long userId) {
        PublicUserResponseDTO publicUserResponseDTO = userService.getUser(userId);
        return ResponseEntity.ok(publicUserResponseDTO);
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<?> updateAvatar(@RequestHeader("X-User-Id") Long userId,
                                          @RequestBody AvatarRequestDTO dto) {
        userService.setProfileImage(userId, dto.getUrl());
        return ResponseEntity.ok().build();
    }





}
