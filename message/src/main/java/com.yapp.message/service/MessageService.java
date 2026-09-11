package com.yapp.message.service;

import com.yapp.message.dto.MessageDTO;
import com.yapp.message.dto.MessageStatusDTO;
import com.yapp.message.dto.MessageTypingDTO;
import com.yapp.message.exception.ConversationNotFoundException;
import com.yapp.message.exception.NotParticipantException;
import com.yapp.message.model.Conversation;
import com.yapp.message.model.Message;
import com.yapp.message.model.MessageStatus;
import com.yapp.message.rateLimiter.TokenBucket;
import com.yapp.message.repo.ConversationRepository;
import com.yapp.message.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RestClient restClient;
    private final TokenBucket tokenBucket;

    @Value("${presence.service.url}")
    private String presenceServiceUrl;

    public void handleMessage(MessageDTO messageDTO, Long senderId) {

        if(!tokenBucket.isAllowed(senderId)){
            return;
        }




        MessageStatus messageStatus = MessageStatus.SENT;

        Conversation c = checkParticipant(messageDTO.getConversationId(),  senderId);

        Long receiverId = (c.getUser1Id().equals(senderId)) ? c.getUser2Id() : c.getUser1Id();

        try{
            Boolean status = restClient.get()
                    .uri(presenceServiceUrl+"/api/presence/chech/status/"+receiverId)
                    .retrieve()
                    .body(Boolean.class);

            if(Boolean.TRUE.equals(status)){
                messageStatus = MessageStatus.DELIVERED;
            }
        }catch (Exception e) {
            log.warn("Presence nedostupan za korisnika {}, poruka ostaje SENT: {}", receiverId, e.getMessage());
        }

        Message message;

        if(messageDTO.getReplyToMessageId() != null) {
            Message m = messageRepository.findById(messageDTO.getReplyToMessageId())
                    .orElseThrow(() -> new RuntimeException("Message not found"));


            if (!m.getConversationId().equals(messageDTO.getConversationId())) {
                throw new RuntimeException("Does not belong to conversation");
            }


            message = Message.builder()
                    .conversationId(messageDTO.getConversationId())
                    .senderId(senderId)
                    .text(messageDTO.getText())
                    .status(messageStatus)
                    .imageUrl(messageDTO.getImageUrl())
                    .replyToMessageId(m.getId())
                    .replyToText(m.getText())
                    .replyToSenderId(m.getSenderId())
                    .build();
        }else{
            message = Message.builder()
                    .conversationId(messageDTO.getConversationId())
                    .senderId(senderId)
                    .text(messageDTO.getText())
                    .status(messageStatus)
                    .imageUrl(messageDTO.getImageUrl())
                    .build();
        }


        messageRepository.save(message);


        messagingTemplate.convertAndSend(
                "/topic/conversation/"+message.getConversationId(), message);

    }

    public List<Message> findMessages(Long conversationId, Long userId, Long before, int size) {
        checkParticipant(conversationId, userId);

        if(before == null) {
            messageStatusSeen(conversationId, userId);
            before = Long.MAX_VALUE;
        }

        PageRequest pageRequest = PageRequest.of(0, size);

        List<Message> messages = messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, before, pageRequest);
        return messages;
    }


    public List<Message> findMedia(Long conversationId, Long userId) {
        checkParticipant(conversationId, userId);
        return messageRepository.findByConversationIdAndImageUrlIsNotNullOrderByCreatedAtDesc(conversationId);
    }


    private Conversation checkParticipant(Long conversationId, Long userId) {
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException("Conversation not found"));
        if (!c.getUser1Id().equals(userId) && !c.getUser2Id().equals(userId)) {
            throw new NotParticipantException("User doesn't belong to this conversation");
        }

        return c;
    }

    @Transactional
    public List<Message> messageStatusDelivered(Long receiverId){
        List<Conversation> conversations = conversationRepository.findByUser1IdOrUser2Id(receiverId, receiverId);
        List<Long> conversationsIds = conversations.stream().map(Conversation::getId).toList();
        List<Message> messages = messageRepository.findMessagesByConversationIdInAndStatusAndSenderIdNot(conversationsIds, MessageStatus.SENT, receiverId);

        for (Message message : messages) {
            message.setStatus(MessageStatus.DELIVERED);
        }

        messageRepository.saveAll(messages);

        Map<Long, List<Message>> grouped = messages.stream().collect(Collectors.groupingBy(Message::getConversationId));

        for(Map.Entry<Long, List<Message>> entry : grouped.entrySet()) {
            Long conversationId = entry.getKey();
            List<Message> messageList = entry.getValue();

            MessageStatusDTO messageStatusDTO = new MessageStatusDTO(conversationId, messageList.stream().map(Message::getId).toList(), MessageStatus.DELIVERED);

            messagingTemplate.convertAndSend("/topic/conversation/"+conversationId+"/status", messageStatusDTO);

        }

        return messages;
    }

    @Transactional
    public List<Message> messageStatusSeen(Long conversationId, Long userId) {
        checkParticipant(conversationId, userId);

        List<Message> messages = messageRepository.findMessagesByConversationIdAndStatusNotAndSenderIdNot(conversationId, MessageStatus.SEEN, userId);

        if(messages.isEmpty()){return messages;}

        for(Message m : messages){
            m.setStatus(MessageStatus.SEEN);
        }
        messageRepository.saveAll(messages);

        MessageStatusDTO dto = new MessageStatusDTO(conversationId, messages.stream().map(Message::getId).toList(), MessageStatus.SEEN);

        messagingTemplate.convertAndSend("/topic/conversation/"+conversationId+"/status", dto);


        return messages;
    }


    public void userTyping(MessageTypingDTO messageTypingDTO) {
        checkParticipant(messageTypingDTO.getConversationId(), messageTypingDTO.getUserId());

        messagingTemplate.convertAndSend("/topic/conversation/"+messageTypingDTO.getConversationId()+"/typing", messageTypingDTO);

    }
}
