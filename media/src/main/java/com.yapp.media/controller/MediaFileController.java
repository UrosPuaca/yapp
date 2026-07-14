package com.yapp.media.controller;

import com.yapp.media.model.MediaFile;
import com.yapp.media.service.MediaFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MediaFileController {

    private final MediaFileService mediaFileService;

    @PostMapping("/media")
    public ResponseEntity<?> uploadFile(@RequestParam MultipartFile file, @RequestParam Long uploadedBy) {
        MediaFile mediaFile = mediaFileService.upload(file, uploadedBy);
        return ResponseEntity.ok(mediaFile);
    }
}
