package com.yapp.message.service;

import com.yapp.message.dto.MyChatDTO;
import com.yapp.message.dto.MyChatUserResponseDTO;
import com.yapp.message.model.Conversation;
import com.yapp.message.model.Message;
import com.yapp.message.repo.ConversationRepository;
import com.yapp.message.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final RestClient restClient;

    @Value("${auth.service.url}")
    private String authServiceUrl;

    public Conversation findOrCreateConversation(Long userA, Long userB) {
        Long user1 = Math.min(userA, userB);
        Long user2 = Math.max(userA, userB);

        return conversationRepository.findByUser1IdAndUser2Id(user1, user2)
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setUser1Id(user1);
                    c.setUser2Id(user2);
                    return conversationRepository.save(c);
                });
    }


    public List<MyChatDTO> loadMyChats(Long userId) {
        List<Conversation> conversations = conversationRepository.findByUser1IdOrUser2Id(userId, userId);
        List<MyChatDTO> result = new ArrayList<>();

        for (Conversation c : conversations) {
            MyChatDTO dto = new MyChatDTO();
            dto.setConversationId(c.getId());

            Long otherUserId = c.getUser1Id().equals(userId) ? c.getUser2Id() : c.getUser1Id();
            dto.setOtherUserId(otherUserId);

            Message m = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(c.getId())
                    .orElse(null);
            if (m != null) {
                dto.setLastMessage(m.getText());
                dto.setLastMessageTime(m.getCreatedAt());
            }


            try {
                MyChatUserResponseDTO profile = restClient.get()
                        .uri(authServiceUrl + "/api/user/" + otherUserId)
                        .retrieve()
                        .body(MyChatUserResponseDTO.class);
                dto.setUsername(profile.getUsername());
                dto.setProfileImageUrl(profile.getProfileImageUrl());
            } catch (Exception e) {
                dto.setUsername("Unknown");
                // profileImageUrl ostaje null
            }


            result.add(dto);
        }
        return result;
    }



}
