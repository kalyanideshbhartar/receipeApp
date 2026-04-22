package com.bluepal.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String bio;
    private String profilePictureUrl;
    private String coverPictureUrl;
}
