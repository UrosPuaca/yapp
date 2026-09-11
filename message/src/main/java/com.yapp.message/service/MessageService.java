package com.yapp.message.service;

import com.yapp.message.dto.*;
import com.yapp.message.exception.ConversationNotFoundException;
import com.yapp.message.exception.NotParticipantException;
import com.yapp.message.model.*;
import com.yapp.message.rateLimiter.TokenBucket;
import com.yapp.message.repo.ConversationRepository;
import com.yapp.message.repo.MessageReactionRepository;
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
    private final MessageReactionRepository messageReactionRepository;

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

        MessageResponseDTO dto = messageToDTO(message, List.of());

        messagingTemplate.convertAndSend(
                "/topic/conversation/"+message.getConversationId(), dto);

    }

    public List<MessageResponseDTO> findMessages(Long conversationId, Long userId, Long before, int size) {
        checkParticipant(conversationId, userId);

        if(before == null) {
            messageStatusSeen(conversationId, userId);
            before = Long.MAX_VALUE;
        }

        PageRequest pageRequest = PageRequest.of(0, size);

        List<Message> messages = messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, before, pageRequest);
        List<Long> messageIds = messages.stream().map(Message::getId).toList();
        List<MessageReaction>  messageReactions = messageReactionRepository.findByMessageIdIn(messageIds);
        Map<Long, List<MessageReaction>> map = messageReactions.stream().collect(Collectors.groupingBy(MessageReaction::getMessageId));
        List<MessageResponseDTO> results = new ArrayList<>();

        for(Message m : messages) {
            List<MessageReaction> reactions = map.getOrDefault(m.getId(), List.of());

            List<ReactionDTO> reactionDTOs = new ArrayList<>();

            for (MessageReaction r : reactions) {
                ReactionDTO reactionDTO = ReactionDTO.builder()
                        .reactionType(r.getReactionType())
                        .messageId(r.getMessageId())
                        .userId(r.getUserId())
                        .build();
                reactionDTOs.add(reactionDTO);
            }

            results.add(messageToDTO(m,  reactionDTOs));

        }
        return results;

    }

    private MessageResponseDTO messageToDTO(Message m, List<ReactionDTO> reactionDTOs) {
            MessageResponseDTO dto = MessageResponseDTO.builder()
                    .id(m.getId())
                    .createdAt(m.getCreatedAt())
                    .conversationId(m.getConversationId())
                    .imageUrl(m.getImageUrl())
                    .status(m.getStatus())
                    .text(m.getText())
                    .senderId(m.getSenderId())
                    .replyToMessageId(m.getReplyToMessageId())
                    .replyToSenderId(m.getReplyToSenderId())
                    .replyToText(m.getReplyToText())
                    .reactions(reactionDTOs)
                    .build();

        return dto;

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


    @Transactional
    public void handleMessageReaction(ReactionDTO reactionDTO, Long userId) {
        Message m = messageRepository.findById(reactionDTO.getMessageId())
                .orElseThrow(()->new RuntimeException("Message not found"));

        checkParticipant(m.getConversationId(), userId);


        MessageReaction reaction = messageReactionRepository.findByMessageIdAndUserId(m.getId(), userId)
                .orElse(null);


        if(reaction == null){
            reaction = createReaction(m.getId(), userId, reactionDTO.getReactionType());
        }else if(reaction.getReactionType() == reactionDTO.getReactionType()){
            messageReactionRepository.delete(reaction);
            reactionDTO.setReactionType(null);
        }else{
            reaction.setReactionType(reactionDTO.getReactionType());
            messageReactionRepository.save(reaction);
        }

        reactionDTO.setUserId(userId);

        messagingTemplate.convertAndSend("/topic/conversation/"+m.getConversationId()+"/reaction", reactionDTO);


    }


    private MessageReaction createReaction(Long messageId, Long userId, ReactionType reactionType) {
        MessageReaction reaction = MessageReaction.builder()
                .reactionType(reactionType)
                .userId(userId)
                .messageId(messageId)
                .build();
        return messageReactionRepository.save(reaction);
    }


}
