package com.bluepal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(length = 200)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Column(length = 500)
    private String bio;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "cover_picture_url")
    private String coverPictureUrl;

    @Builder.Default
    @Column(name = "follower_count", nullable = false)
    private Integer followerCount = 0;

    @Builder.Default
    @Column(name = "following_count", nullable = false)
    private Integer followingCount = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    @Builder.Default
    private Set<String> roles = new HashSet<>(Set.of("ROLE_USER"));

    @Builder.Default
    @Column(name = "is_verified", nullable = false)
    @JsonProperty("isVerified")
    private boolean verified = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(name = "reputation_points", nullable = false)
    private Integer reputationPoints = 0;

    @Column(name = "reputation_level", length = 50)
    private String reputationLevel;

    @Builder.Default
    @Column(name = "is_premium_user", nullable = false)
    @JsonProperty("premium")
    private boolean premium = false;

    @Column(name = "premium_expiry_date")
    private LocalDateTime premiumExpiryDate;

    @Builder.Default
    @Column(name = "is_restricted", nullable = false)
    @JsonProperty("isRestricted")
    private boolean restricted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isPremium() {
        return this.premium;
    }

    public void setPremium(boolean premium) {
        this.premium = premium;
    }

    public boolean hasActivePremium() {
        // Log the state for debugging (helps identify sync issues)
        log.debug("DEBUG: [PremiumCheck] User: {}", (this.username != null ? this.username : this.id));
        log.debug("DEBUG: [PremiumCheck] Roles: {}", this.roles);
        log.debug("DEBUG: [PremiumCheck] Flag: {}, Expiry: {}", this.premium, this.premiumExpiryDate);
        
        // 1. ADMINS automatically have premium access (standard fail-safe)
        if (this.roles != null && (this.roles.contains("ROLE_ADMIN") || this.roles.contains("ADMIN"))) {
            return true;
        }

        // 2. EXPIRY-FIRST CHECK: If we have a future expiry date, they ARE premium
        if (this.premiumExpiryDate != null) {
            boolean isStillValid = this.premiumExpiryDate.isAfter(LocalDateTime.now());
            if (isStillValid) {
                // Self-healing: if date is valid but flag is false, we should treat as premium
                return true; 
            }
        }

        // 3. FALLBACK TO FLAG: Handle legacy or manually set users without expiry but with flag
        return this.premium;
    }
}
