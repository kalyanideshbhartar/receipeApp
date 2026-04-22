package com.bluepal.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@example.com");
    }

    @Test
    void init_Coverage() {
        assertDoesNotThrow(() -> emailService.init());
        // Just for coverage of logging statements
    }

    @Test
    void sendResetPasswordEmail_Success() {
        emailService.sendResetPasswordEmail("user@example.com", "123456");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertEquals("user@example.com", message.getTo()[0]);
        assertTrue(message.getText().contains("123456"));
        assertEquals("test@example.com", message.getFrom());
    }

    @Test
    void sendVerificationEmail_Success() {
        emailService.sendVerificationEmail("user@example.com", "token123");

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendRestrictionEmail_Restricted() {
        emailService.sendRestrictionEmail("user@example.com", "username", true);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        assertEquals("Account Restricted - CulinarIO", messageCaptor.getValue().getSubject());
    }

    @Test
    void sendRestrictionEmail_Restored() {
        emailService.sendRestrictionEmail("user@example.com", "username", false);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        assertEquals("Account Access Restored - CulinarIO", messageCaptor.getValue().getSubject());
    }

    @Test
    void sendEmails_MailSenderNull_DoesNotThrow() {
        EmailServiceImpl nullService = new EmailServiceImpl(null);
        
        // Should not throw NPE
        assertDoesNotThrow(() -> nullService.sendResetPasswordEmail("a@b.com", "123"));
        assertDoesNotThrow(() -> nullService.sendVerificationEmail("a@b.com", "123"));
        assertDoesNotThrow(() -> nullService.sendRestrictionEmail("a@b.com", "user", true));
    }

    @Test
    void resolveFromAddress_Fallback() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "");
        emailService.sendResetPasswordEmail("user@example.com", "123");
        
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());
        assertEquals("noreply@culinario.com", messageCaptor.getValue().getFrom());
    }
}
