package com.yapp.message.service;

import com.yapp.message.model.Conversation;
import com.yapp.message.repo.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;

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

}
