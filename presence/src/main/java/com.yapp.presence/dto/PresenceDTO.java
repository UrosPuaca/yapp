package com.yapp.presence.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PresenceDTO {

    private Long userId;

    private String lastSeen;

    private boolean online;
}
