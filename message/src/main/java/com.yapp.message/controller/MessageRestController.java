package com.yapp.message.controller;

import com.yapp.message.model.Message;
import com.yapp.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageRestController {
    private final MessageService messageService;

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> findMessages(@PathVariable Long conversationId) {
        List<Message> messages = messageService.findMessages(conversationId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/media/{conversationId}")
    public ResponseEntity<?> findMediaMessages(@PathVariable Long conversationId) {
        List<Message> messages = messageService.findMedia(conversationId);
        return ResponseEntity.ok(messages);
    }
}
