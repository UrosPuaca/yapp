package com.yapp.auth.dto;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserResponseDTO {
    private String name;
    private String surname;
    private String email;
    private String username;
    private String profileImageUrl;
}
