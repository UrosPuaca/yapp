package com.yapp.auth.controller;

import com.yapp.auth.config.JwtUtil;
import com.yapp.auth.dto.LoginRequestDTO;
import com.yapp.auth.dto.LoginResponseDTO;
import com.yapp.auth.dto.RegisterRequestDTO;
import com.yapp.auth.model.User;
import com.yapp.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?>register(@Valid @RequestBody RegisterRequestDTO registerRequestDTO) {
            User user = authService.registerUser(registerRequestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?>login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
            String token = authService.loginUser(loginRequestDTO);
            return ResponseEntity.ok(new LoginResponseDTO(token));
    }


    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = authService.getUserId(token);
            return ResponseEntity.ok(userId);
        }catch (RuntimeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }

    }

}
