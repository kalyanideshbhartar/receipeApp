package com.bluepal.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl {

    private static final String NOREPLY_ADDRESS = "noreply@culinario.com";
    private static final String SMTP_ERROR_DETAILS = "SMTP Error Details: {}";

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromEmail;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.password:}")
    private String mailPassword;

    @org.springframework.beans.factory.annotation.Value("${app.mail.dev-mode:false}")
    private boolean devMode;

    public EmailServiceImpl(
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        log.debug("Email Service initialized. fromEmail configured: {}", fromEmail != null && !fromEmail.isEmpty());
        boolean passwordSet = mailPassword != null && !mailPassword.isEmpty();
        log.debug("mailPassword: {}", passwordSet ? "set (length " + mailPassword.length() + ")" : "not set");
        log.info("Email Service Mode: {}", devMode ? "DEVELOPMENT (Console Fallback Enabled)" : "PRODUCTION (SMTP)");
    }

    private String resolveFromAddress() {
        return (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : NOREPLY_ADDRESS;
    }

    public void sendResetPasswordEmail(String to, String token) {
        if (mailSender == null) {
            log.error("Mail sender not configured. [DEV-MODE FALLBACK] Reset OTP for {}: {}", to, token);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(to);
            message.setSubject("Password Reset OTP - CulinarIO");
            message.setText("Hello,\n\n"
                    + "We received a request to reset your password for your CulinarIO account.\n\n"
                    + "Your 6-Digit OTP is: " + token + "\n\n"
                    + "Please use this code in the application to reset your password. It will expire in 24 hours.\n"
                    + "If you did not request this, you can safely ignore this email.");

            mailSender.send(message);
            log.info("Password reset email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}. [DEV-MODE FALLBACK] OTP: {}", to, token);
            log.error(SMTP_ERROR_DETAILS, e.getMessage());
            if (!devMode) {
                throw e; // Re-throw in production to notify controller
            }
        }
    }

    public void sendVerificationEmail(String to, String token) {
        if (mailSender == null) {
            log.error("Mail sender not configured. [DEV-MODE FALLBACK] Verification Token for {}: {}", to, token);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(to);
            message.setSubject("Verify Your Email - CulinarIO");
            String verificationUrl = "http://172.30.224.1:5173/verify-email?token=" + token;
            message.setText("Hello,\n\n"
                    + "Thank you for registering with CulinarIO! Please click the link below to verify your email address:\n\n"
                    + verificationUrl + "\n\n"
                    + "This link will expire in 24 hours.\n"
                    + "If you did not register for an account, you can safely ignore this email.");

            mailSender.send(message);
            log.info("Verification email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}. [DEV-MODE FALLBACK] Token: {}", to, token);
            log.error(SMTP_ERROR_DETAILS, e.getMessage());
            if (!devMode) {
                throw e;
            }
        }
    }

    public void sendRestrictionEmail(String to, String username, boolean isRestricted) {
        if (mailSender == null) {
            log.error("Mail sender not configured. [DEV-MODE FALLBACK] Restriction status for {}: (Restricted: {})", to, isRestricted);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(to);

            if (isRestricted) {
                message.setSubject("Account Restricted - CulinarIO");
                message.setText("Hello " + username + ",\n\n"
                        + "your account is restricted by admin we cannot login again.\n\n"
                        + "If you believe this is a mistake, please contact our support team.");
            } else {
                message.setSubject("Account Access Restored - CulinarIO");
                message.setText("Hello " + username + ",\n\n"
                        + "Good news! Your account access on CulinarIO has been restored.\n\n"
                        + "You can now log in and continue sharing your culinary journey with the community.\n\n"
                        + "Welcome back!");
            }

            mailSender.send(message);
            log.info("Restriction status email sent to: {} (Restricted: {})", to, isRestricted);
        } catch (Exception e) {
            log.error("Failed to send restriction status email to {}. [DEV-MODE FALLBACK] Restricted: {}", to, isRestricted);
            log.error(SMTP_ERROR_DETAILS, e.getMessage());
            if (!devMode) {
                throw e;
            }
        }
    }
}
