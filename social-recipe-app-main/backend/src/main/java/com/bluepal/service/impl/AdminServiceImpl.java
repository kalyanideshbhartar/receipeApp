package com.bluepal.service.impl;

import com.bluepal.entity.AuditLog;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.*;
import com.bluepal.service.interfaces.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final LikeRepository likeRepository;
    private final BookmarkRepository bookmarkRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;
    private final FollowRepository followRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailServiceImpl emailService;
 
    private static final String USER = "User";
    private static final String USERNAME = "username";

    @Override
    @Transactional
    public void mergeUsers(String sourceUsername, String targetUsername, String adminUsername) {
        if (sourceUsername.equalsIgnoreCase(targetUsername)) {
            throw new IllegalArgumentException("Cannot merge a user into themselves");
        }

        User source = userRepository.findByUsername(sourceUsername)
                .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, sourceUsername));
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, targetUsername));

        log.info("Admin {} merging user {} into {}", adminUsername, sourceUsername, targetUsername);

        Long sId = source.getId();
        Long tId = target.getId();

        // 1. Transfer Recipes
        List<Recipe> sourceRecipes = recipeRepository.findByAuthor(source);
        for (Recipe recipe : sourceRecipes) {
            recipe.setAuthor(target);
        }
        recipeRepository.saveAll(sourceRecipes);

        // 2. Transfer Likes (Safe merge)
        likeRepository.deleteDuplicateLikes(sId, tId);
        likeRepository.updateUserForLikes(sId, tId);

        // 3. Transfer Bookmarks (Safe merge)
        bookmarkRepository.deleteDuplicateBookmarks(sId, tId);
        bookmarkRepository.updateUserForBookmarks(sId, tId);

        // 4. Transfer Ratings (Safe merge)
        ratingRepository.deleteDuplicateRatings(sId, tId);
        ratingRepository.updateUserForRatings(sId, tId);

        // 5. Transfer Comments
        commentRepository.updateUserForComments(sId, tId);

        // 6. Transfer Follows
        followRepository.deleteDuplicateFollowings(sId, tId);
        followRepository.transferFollowings(sId, tId);
        followRepository.deleteDuplicateFollowers(sId, tId);
        followRepository.transferFollowers(sId, tId);

        // 7. Audit Log
        AuditLog auditLog = AuditLog.builder()
                .action("MERGE_USERS")
                .performedBy(adminUsername)
                .target("Source: " + sourceUsername + " (ID:" + sId + "), Target: " + targetUsername + " (ID:" + tId + ")")
                .details("Merged recipes, likes, bookmarks, ratings, comments, and follows.")
                .build();
        auditLogRepository.save(auditLog);

        // 8. Delete source user
        userRepository.delete(source);
    }

    @Override
    @Transactional
    public void updatePremiumStatus(String username, boolean isPremium, Integer durationDays, String adminUsername) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

        user.setPremium(isPremium);
        if (isPremium && durationDays != null) {
            user.setPremiumExpiryDate(LocalDateTime.now().plusDays(durationDays));
        } else if (!isPremium) {
            user.setPremiumExpiryDate(null);
        }

        userRepository.save(user);

        AuditLog auditLog = AuditLog.builder()
                .action("PREMIUM_OVERRIDE")
                .performedBy(adminUsername)
                .target("User: " + username)
                .details("Set premium=" + isPremium + (durationDays != null ? ", Duration=" + durationDays + " days" : ""))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Override
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    @Transactional
    public void restrictUser(String username, boolean restricted, String adminUsername) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

        // SECURITY CHECK: Cannot restrict an administrator
        if (restricted && user.getRoles().contains("ROLE_ADMIN")) {
            throw new IllegalArgumentException("Administrator accounts cannot be restricted.");
        }

        user.setRestricted(restricted);
        userRepository.save(user);

        // Send notification email
        try {
            emailService.sendRestrictionEmail(user.getEmail(), user.getUsername(), restricted);
        } catch (Exception e) {
            log.error("Failed to send restriction email to {}: {}", username, e.getMessage());
        }

        AuditLog auditLog = AuditLog.builder()
                .action(restricted ? "RESTRICT_USER" : "UNRESTRICT_USER")
                .performedBy(adminUsername)
                .target("User: " + username)
                .details("Restriction toggled to: " + restricted)
                .build();
        auditLogRepository.save(auditLog);
    }
}
