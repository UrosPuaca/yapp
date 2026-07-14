package com.yapp.message.controller;

import com.yapp.message.dto.MessageDTO;
import com.yapp.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @MessageMapping("/message")
    public void sendMessage(MessageDTO messageDTO) {
        messageService.handleMessage(messageDTO);
    }

}
