package com.yapp.message.controller;

import com.yapp.message.dto.ConversationRequestDTO;
import com.yapp.message.model.Conversation;
import com.yapp.message.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversation")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping("")
    public ResponseEntity<?> findOrCreateConversation(@RequestBody ConversationRequestDTO findOrCreateConvetsationDTO) {
        Conversation conversation = conversationService.findOrCreateConversation(findOrCreateConvetsationDTO.getUser1Id(),  findOrCreateConvetsationDTO.getUser2Id());
        return ResponseEntity.ok(conversation);
    }



}
