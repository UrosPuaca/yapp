package com.yapp.message.repo;

import com.yapp.message.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    List<Message> findByConversationIdAndImageUrlIsNotNullOrderByCreatedAtDesc(Long conversationId);
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
