package com.yapp.message.controller;

import com.yapp.message.model.Message;
import com.yapp.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageRestController {
    private final MessageService messageService;

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> findMessages(@PathVariable Long conversationId, @RequestHeader("X-User-Id") Long userId) {
            List<Message> messages = messageService.findMessages(conversationId, userId);
            return ResponseEntity.ok(messages);
    }

    @GetMapping("/media/{conversationId}")
    public ResponseEntity<?> findMediaMessages(@PathVariable Long conversationId, @RequestHeader("X-User-Id") Long userId) {
            List<Message> messages = messageService.findMedia(conversationId, userId);
            return ResponseEntity.ok(messages);
    }
}
