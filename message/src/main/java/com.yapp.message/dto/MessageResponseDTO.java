package com.yapp.message.dto;

import com.yapp.message.model.MessageStatus;
import com.yapp.message.model.ReactionType;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageResponseDTO {
    private Long id;

    private Long conversationId;

    private Long senderId;

    private String text;

    private String imageUrl;

    private Date createdAt;

    private MessageStatus status;

    private Long replyToMessageId;

    private String replyToText;

    private Long replyToSenderId;

    private List<ReactionDTO> reactions;
}
