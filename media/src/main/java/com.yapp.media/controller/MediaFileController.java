package com.yapp.media.controller;

import com.yapp.media.model.MediaFile;
import com.yapp.media.service.MediaFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/media")
public class MediaFileController {

    private final MediaFileService mediaFileService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam MultipartFile file, @RequestHeader("X-User-Id") Long userId) {
        MediaFile mediaFile = mediaFileService.upload(file, Long.valueOf(userId));
        return ResponseEntity.ok(mediaFile);
    }
}
