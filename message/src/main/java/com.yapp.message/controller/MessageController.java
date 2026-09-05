package com.yapp.message.controller;

import com.yapp.message.config.AuthChannelInterceptor;
import com.yapp.message.dto.MessageDTO;
import com.yapp.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api")
public class MessageController {
    private final MessageService messageService;

    @MessageMapping("/message")
    public void sendMessage(MessageDTO messageDTO, Principal principal) {
        Long senderId = Long.valueOf(principal.getName());
        messageService.handleMessage(messageDTO, senderId);
    }




}
