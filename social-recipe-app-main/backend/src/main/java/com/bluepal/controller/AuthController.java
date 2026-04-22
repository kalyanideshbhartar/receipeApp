package com.bluepal.controller;

import com.bluepal.dto.request.LoginRequest;
import com.bluepal.dto.request.RegisterRequest;
import com.bluepal.dto.response.MessageResponse;
import com.bluepal.dto.response.JwtResponse;
import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.security.CustomUserDetails;
import com.bluepal.security.JwtUtils;
import com.bluepal.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import com.bluepal.dto.request.ForgotPasswordRequest;
import com.bluepal.dto.request.ResetPasswordRequest;
import com.bluepal.entity.PasswordResetToken;
import com.bluepal.entity.VerificationToken;
import com.bluepal.repository.PasswordResetTokenRepository;
import com.bluepal.repository.VerificationTokenRepository;
import com.bluepal.service.impl.EmailServiceImpl;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private static final String USERNAME_FIELD = "username";

        private final AuthenticationManager authenticationManager;
        private final UserRepository userRepository;
        private final PasswordEncoder encoder;
        private final JwtUtils jwtUtils;
        private final PasswordResetTokenRepository passwordResetTokenRepository;
        private final VerificationTokenRepository verificationTokenRepository;
        private final EmailServiceImpl emailService;

        public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                        PasswordEncoder encoder, JwtUtils jwtUtils,
                        PasswordResetTokenRepository passwordResetTokenRepository,
                        VerificationTokenRepository verificationTokenRepository,
                        EmailServiceImpl emailService) {
                this.authenticationManager = authenticationManager;
                this.userRepository = userRepository;
                this.encoder = encoder;
                this.jwtUtils = jwtUtils;
                this.passwordResetTokenRepository = passwordResetTokenRepository;
                this.verificationTokenRepository = verificationTokenRepository;
                this.emailService = emailService;
        }

        @PostMapping("/login")
        public ResponseEntity<Object> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
                try {
                        Authentication authentication = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                                                        loginRequest.getPassword()));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

                        String jwt = jwtUtils.generateJwtToken(authentication);

                        List<String> roles = userDetails.getAuthorities().stream()
                                        .map(GrantedAuthority::getAuthority)
                                        .toList();

                        User userInstance = userRepository.findById(userDetails.getId()).orElse(null);
                        boolean isPremium = userInstance != null && userInstance.hasActivePremium();

                        return ResponseEntity.ok(new JwtResponse(jwt,
                                        userDetails.getId(),
                                        userDetails.getUsername(),
                                        userDetails.getEmail(),
                                        userInstance != null ? userInstance.getFullName() : null,
                                        roles,
                                        isPremium));
                } catch (org.springframework.security.authentication.LockedException | org.springframework.security.authentication.DisabledException e) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("your account is restricted by admin"));
                } catch (org.springframework.security.core.AuthenticationException e) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Invalid username or password!"));
                }
    }

        @PostMapping("/register")
        @Transactional
        public ResponseEntity<MessageResponse> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
                try {
                        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                                return ResponseEntity
                                                .badRequest()
                                                .body(new MessageResponse("Error: Username is already taken!"));
                        }

                        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                                return ResponseEntity
                                                .badRequest()
                                                .body(new MessageResponse("Error: Email is already in use!"));
                        }

                        // Create new user's account
                        User user = User.builder()
                                        .username(signUpRequest.getUsername())
                                        .fullName(signUpRequest.getFullName())
                                        .email(signUpRequest.getEmail())
                                        .password(encoder.encode(signUpRequest.getPassword()))
                                        .enabled(true)
                                        .build();

                        userRepository.save(user);

                        return ResponseEntity.ok(new MessageResponse("Registration successful! You can now log in."));
                } catch (Exception e) {
                        log.error("Registration failed: {}", e.getMessage());
                        return ResponseEntity.internalServerError().body(new MessageResponse("Error: " + e.getMessage()));
                }
        }

        @GetMapping("/verify-registration")
        @Transactional
        public ResponseEntity<MessageResponse> verifyRegistration(@RequestParam("token") String token) {
                Optional<VerificationToken> tokenOpt = verificationTokenRepository.findByToken(token);
                
                if (tokenOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid verification token!"));
                }

                VerificationToken verificationToken = tokenOpt.get();
                if (verificationToken.isExpired()) {
                        verificationTokenRepository.delete(verificationToken);
                        return ResponseEntity.badRequest().body(new MessageResponse("Error: Verification token has expired!"));
                }

                User user = verificationToken.getUser();
                user.setEnabled(true);
                userRepository.save(user);

                verificationTokenRepository.delete(verificationToken);

                return ResponseEntity.ok(new MessageResponse("Account verified successfully! You can now log in."));
        }

        @PostMapping("/change-password")
        public ResponseEntity<MessageResponse> changePassword(
                        @RequestBody java.util.Map<String, String> body,
                        org.springframework.security.core.Authentication auth) {
                if (auth == null || !auth.isAuthenticated()) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Unauthorized"));
                }
                String username = auth.getName();
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new com.bluepal.exception.ResourceNotFoundException("User",
                                                USERNAME_FIELD, username));

                String currentPassword = body.get("currentPassword");
                String newPassword = body.get("newPassword");

                if (!encoder.matches(currentPassword, user.getPassword())) {
                        return ResponseEntity.badRequest().body(new MessageResponse("Current password is incorrect"));
                }
                if (newPassword == null || newPassword.length() < 6) {
                        return ResponseEntity.badRequest().body(new MessageResponse("New password must be at least 6 characters"));
                }

                user.setPassword(encoder.encode(newPassword));
                userRepository.save(user);
                return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        }

        @org.springframework.web.bind.annotation.DeleteMapping("/users/me")
        public ResponseEntity<MessageResponse> deleteAccount(org.springframework.security.core.Authentication auth) {
                if (auth == null || !auth.isAuthenticated()) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Unauthorized"));
                }
                String username = auth.getName();
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new com.bluepal.exception.ResourceNotFoundException("User",
                                                USERNAME_FIELD, username));
                userRepository.delete(user);
                return ResponseEntity.ok(new MessageResponse("Account deleted successfully"));
        }

        @PostMapping("/forgot-password")
        @Transactional
        public ResponseEntity<MessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
                Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
                if (userOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body(new MessageResponse("Error: User with this email not found!"));
                }
                User user = userOpt.get();

                // Delete any existing token for this user
                passwordResetTokenRepository.findByUser(user).ifPresent(passwordResetTokenRepository::delete);

                String token = String.format("%06d", new SecureRandom().nextInt(1000000));
                PasswordResetToken resetToken = PasswordResetToken.builder()
                                .token(token)
                                .user(user)
                                .expiryDate(LocalDateTime.now().plusHours(24))
                                .build();

                passwordResetTokenRepository.save(resetToken);

                try {
                        emailService.sendResetPasswordEmail(user.getEmail(), token);
                        return ResponseEntity.ok(new MessageResponse("Password reset email sent!"));
                } catch (Exception e) {
                        log.error("CRITICAL: Failed to send OTP email to {} : {}", user.getEmail(), e.getMessage());
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(new MessageResponse("Error: Failed to send reset email. Please ensure the mail server is configured correctly."));
                }
        }

        @PostMapping("/reset-password")
        @Transactional
        public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
                PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

                if (resetToken.isExpired()) {
                        passwordResetTokenRepository.delete(resetToken);
                        return ResponseEntity.badRequest().body(new MessageResponse("Token has expired"));
                }

                User user = resetToken.getUser();
                user.setPassword(encoder.encode(request.getNewPassword()));
                userRepository.save(user);

                passwordResetTokenRepository.delete(resetToken);

                return ResponseEntity.ok(new MessageResponse("Password reset successful!"));
        }

        @GetMapping("/me")
        public ResponseEntity<JwtResponse> getCurrentUser() {
                String username = SecurityUtils.getCurrentUsername();
                if (username == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }

                User user = userRepository.findByUsernameIgnoreCase(username)
                                .orElseThrow(() -> new com.bluepal.exception.ResourceNotFoundException("User", USERNAME_FIELD, username));

                List<String> roles = user.getRoles().stream().toList();

                return ResponseEntity.ok(new JwtResponse(
                                null, // No need to return the token again
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.getFullName(),
                                roles,
                                user.hasActivePremium()));
    }

        @ResponseStatus(HttpStatus.BAD_REQUEST)
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public Map<String, String> handleValidationExceptions(MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                        log.error("Validation error on field '{}': {}", fieldName, errorMessage);
                });
                return errors;
        }
}
