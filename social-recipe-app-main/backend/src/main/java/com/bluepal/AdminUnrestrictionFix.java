package com.bluepal;

import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * TEMPORARY FIX: This component runs AFTER startup to ensure the admin user is not restricted.
 * It uses ApplicationRunner instead of @PostConstruct to avoid early initialization issues.
 * This file should be deleted once the admin confirms they can log in.
 */
// @Component
@RequiredArgsConstructor
@Slf4j
public class AdminUnrestrictionFix implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Checking for restricted admin accounts...");

        try {
            // Try by username
            userRepository.findByUsername("admin").ifPresent(this::checkAndUnrestrict);

            // Try by email
            userRepository.findByEmail("admin@culinario.com").ifPresent(this::checkAndUnrestrict);

            log.info("Admin unrestriction check complete.");
        } catch (Exception e) {
            log.error("Failed to check/unrestrict admin account: {}", e.getMessage());
        }
    }

    private void checkAndUnrestrict(User user) {
        if (user.isRestricted()) {
            log.warn("Found restricted admin user: {}. Unrestricting now...", user.getUsername());
            user.setRestricted(false);
            userRepository.save(user);
            log.info("Successfully unrestricted user: {}", user.getUsername());
        }
    }
}
