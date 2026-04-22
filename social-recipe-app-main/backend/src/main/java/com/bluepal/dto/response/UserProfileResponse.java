package com.bluepal.dto.response;

import java.util.Set;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String fullName;
    private String bio;
    private String profilePictureUrl;
    private String coverPictureUrl;
    private Integer followerCount;
    private Integer followingCount;
    private Boolean isFollowing;
    private Boolean isVerified;
    private Integer reputationPoints;
    private String reputationLevel;
    private Integer recipeCount;
    @JsonProperty("premium")
    private Boolean premium;
    private java.time.LocalDateTime premiumExpiryDate;
    private Set<String> roles;
}
