package com.yapp.auth.controller;

import com.yapp.auth.dto.LoginRequestDTO;
import com.yapp.auth.dto.LoginResponseDTO;
import com.yapp.auth.dto.RegisterRequestDTO;
import com.yapp.auth.model.User;
import com.yapp.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?>register(@Valid @RequestBody RegisterRequestDTO registerRequestDTO) {
        try {
            User user = authService.registerUser(registerRequestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered");
        }catch (RuntimeException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?>login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
        try {
            String token = authService.loginUser(loginRequestDTO);
            return ResponseEntity.ok(new LoginResponseDTO(token));
        }catch (RuntimeException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



}
