package com.yapp.message.dto;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MyChatDTO {
    private Long conversationId;
    private Long otherUserId;
    private String username;
    private String profileImageUrl;
    private String lastMessage;
    private Date lastMessageTime;
}
