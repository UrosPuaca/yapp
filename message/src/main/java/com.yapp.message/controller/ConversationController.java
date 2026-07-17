package com.yapp.message.controller;

import com.yapp.message.dto.ConversationRequestDTO;
import com.yapp.message.model.Conversation;
import com.yapp.message.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversation")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping("")
    public ResponseEntity<?> findOrCreateConversation(@RequestBody ConversationRequestDTO conversationRequestDTO, @RequestHeader("X-User-Id") Long userId) {
        Conversation conversation = conversationService.findOrCreateConversation(conversationRequestDTO.getOtherUserId(),  userId);
        return ResponseEntity.ok(conversation);
    }



}
