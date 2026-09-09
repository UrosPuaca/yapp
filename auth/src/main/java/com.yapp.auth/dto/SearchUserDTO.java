package com.yapp.auth.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SearchUserDTO {
    private Long userId;
    private String username;
    private String profileImageUrl;
}
