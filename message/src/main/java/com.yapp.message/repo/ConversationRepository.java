package com.yapp.message.repo;

import com.yapp.message.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation,Long> {
    Optional<Conversation> findByUser1IdAndUser2Id(Long user1Id,Long user2Id);
}
