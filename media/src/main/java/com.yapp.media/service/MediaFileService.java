package com.yapp.media.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.yapp.media.model.MediaFile;
import com.yapp.media.repo.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MediaFileService {

    private final MediaFileRepository mediaFileRepository;
    private final Cloudinary cloudinary;

    public MediaFile upload(MultipartFile file, Long uploadedBy) {
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            String url = uploadResult.get("url").toString();
            String publicId = uploadResult.get("public_id").toString();

            MediaFile mediaFile = MediaFile.builder()
                    .url(url)
                    .publicId(publicId)
                    .fileName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .fileType(file.getContentType())
                    .uploadedBy(uploadedBy)
                    .build();
            return mediaFileRepository.save(mediaFile);

        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }


}
