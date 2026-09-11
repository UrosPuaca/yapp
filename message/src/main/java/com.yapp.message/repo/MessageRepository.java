package com.yapp.message.repo;

import com.yapp.message.model.Message;
import com.yapp.message.model.MessageStatus;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdAndImageUrlIsNotNullOrderByCreatedAtDesc(Long conversationId);
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long before, Pageable pageable);

    List<Message> findMessagesByConversationIdInAndStatusAndSenderIdNot(List<Long> conversationIds, MessageStatus messageStatus, Long senderId);

    List<Message> findMessagesByConversationIdAndStatusNotAndSenderIdNot(Long conversationId, MessageStatus messageStatus, Long senderId);

    List<Message> findMessagesByConversationIdInAndStatusNotAndSenderIdNot(List<Long> conversationIds, MessageStatus messageStatus, Long senderId);


}
