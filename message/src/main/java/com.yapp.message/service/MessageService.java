package com.yapp.message.service;

import com.yapp.message.dto.MessageDTO;
import com.yapp.message.model.Message;
import com.yapp.message.model.MessageStatus;
import com.yapp.message.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void handleMessage(MessageDTO messageDTO) {
        Message message = Message.builder()
                .conversationId(messageDTO.getConversationId())
                .senderId(messageDTO.getSenderId())
                .text(messageDTO.getText())
                .status(MessageStatus.SENT)
                .build();

        messageRepository.save(message);


        messagingTemplate.convertAndSend(
                "/topic/conversation/"+message.getConversationId(), message);

    }
}
