package com.bluepal.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Api;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceImplTest {

    private Cloudinary cloudinary;
    private Uploader uploader;
    private CloudinaryServiceImpl cloudinaryService;

    @BeforeEach
    void setUp() {
        java.util.Map<String, String> config = new java.util.HashMap<>();
        config.put("cloud_name", "test_cloud");
        config.put("api_key", "test_key");
        config.put("api_secret", "test_secret");
        cloudinary = new Cloudinary(config);
        
        // We still want to mock the uploader for the delete test
        uploader = mock(Uploader.class);
        
        // Cloudinary.uploader() is a method, but the Cloudinary object we created is real.
        // We might need to spy it to return our mock uploader.
        cloudinary = spy(cloudinary);
        
        cloudinaryService = new CloudinaryServiceImpl(cloudinary);
    }

    @Test
    void generateSignedUploadUrl_Success() throws Exception {
        // apiSignRequest is a method we can verify or just let run with real logic
        Map<String, String> result = cloudinaryService.generateSignedUploadUrl("test-folder");

        assertNotNull(result);
        assertNotNull(result.get("signature"));
        assertEquals("test-folder", result.get("folder"));
        assertEquals("test_key", result.get("apiKey"));
    }

    @Test
    void deleteImage_Success() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);

        cloudinaryService.deleteImage("public-id");

        verify(uploader).destroy(eq("public-id"), any());
    }
}
