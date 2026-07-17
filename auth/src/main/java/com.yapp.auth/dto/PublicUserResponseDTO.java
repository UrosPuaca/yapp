package com.yapp.auth.dto;

import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicUserResponseDTO {
    private String name;
    private String surname;
    private String username;
    private String profileImageUrl;
}
