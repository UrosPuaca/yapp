package com.yapp.message.service;

import com.yapp.message.dto.MessageDTO;
import com.yapp.message.model.Conversation;
import com.yapp.message.model.Message;
import com.yapp.message.model.MessageStatus;
import com.yapp.message.repo.ConversationRepository;
import com.yapp.message.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void handleMessage(MessageDTO messageDTO) {
        Message message = Message.builder()
                .conversationId(messageDTO.getConversationId())
                .senderId(messageDTO.getSenderId())
                .text(messageDTO.getText())
                .status(MessageStatus.SENT)
                .imageUrl(messageDTO.getImageUrl())
                .build();

        messageRepository.save(message);


        messagingTemplate.convertAndSend(
                "/topic/conversation/"+message.getConversationId(), message);

    }

    public List<Message> findMessages(Long conversationId, Long userId) {
        checkParticipant(conversationId, userId);

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return messages;
    }


    public List<Message> findMedia(Long conversationId, Long userId) {
        checkParticipant(conversationId, userId);
        return messageRepository.findByConversationIdAndImageUrlIsNotNullOrderByCreatedAtDesc(conversationId);
    }


    private void checkParticipant(Long conversationId, Long userId) {
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        if (!c.getUser1Id().equals(userId) && !c.getUser2Id().equals(userId)) {
            throw new RuntimeException("User doesn't belong to this conversation");
        }
    }

}
