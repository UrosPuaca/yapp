package com.yapp.auth.dto;

import lombok.*;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
@Builder
public class LoginResponseDTO {
    private String token;
    private String username;
}
