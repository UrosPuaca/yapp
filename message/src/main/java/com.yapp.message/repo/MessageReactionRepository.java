package com.yapp.message.repo;

import com.yapp.message.model.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    List<MessageReaction> findByMessageIdIn(List<Long> messageIds);

    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);
}
