package com.bluepal.service.interfaces;

import java.util.Map;

public interface CloudinaryService {
    Map<String, String> generateSignedUploadUrl(String folder);
    String uploadImage(org.springframework.web.multipart.MultipartFile file, String folder);
    void deleteImage(String publicId);
}
