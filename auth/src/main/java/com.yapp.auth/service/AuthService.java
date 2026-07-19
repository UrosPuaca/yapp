package com.yapp.auth.service;

import com.yapp.auth.config.JwtUtil;
import com.yapp.auth.dto.LoginRequestDTO;
import com.yapp.auth.dto.LoginResponseDTO;
import com.yapp.auth.dto.RegisterRequestDTO;
import com.yapp.auth.exception.EmailTakenException;
import com.yapp.auth.exception.InvalidCredentialsException;
import com.yapp.auth.exception.UserNotFoundException;
import com.yapp.auth.exception.UsernameTakenException;
import com.yapp.auth.model.User;
import com.yapp.auth.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public User registerUser(RegisterRequestDTO registerRequestDTO) {
        if(userRepository.existsByUsername(registerRequestDTO.getUsername())) {
            throw new UsernameTakenException("Username is already in use");
        }
        if(userRepository.existsByEmail(registerRequestDTO.getEmail())) {
            throw new EmailTakenException("Email is already in use");
        }

        User user = User.builder()
                .username(registerRequestDTO.getUsername())
                .email(registerRequestDTO.getEmail())
                .password(passwordEncoder.encode(registerRequestDTO.getPassword()))
                .name(registerRequestDTO.getName())
                .surname(registerRequestDTO.getSurname())
                .build();

        userRepository.save(user);
        return user;

    }

    public LoginResponseDTO loginUser(LoginRequestDTO loginRequestDTO) {
        User user = userRepository.findByEmail(loginRequestDTO.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if(!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getUserId());
        return LoginResponseDTO.builder()
                .token(token)
                .username(user.getUsername())
                .build();
    }

    public Long getUserId(String token) {
        return jwtUtil.validateAndGetUserId(token);
    }



}
