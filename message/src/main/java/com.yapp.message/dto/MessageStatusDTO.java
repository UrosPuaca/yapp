package com.yapp.message.dto;

import com.yapp.message.model.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageStatusDTO {

    private Long conversationId;

    private List<Long> messagesIds;

    private MessageStatus status;
}
