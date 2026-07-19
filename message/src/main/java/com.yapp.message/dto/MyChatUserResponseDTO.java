package com.yapp.message.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MyChatUserResponseDTO {
    private String username;
    private String profileImageUrl;
}
