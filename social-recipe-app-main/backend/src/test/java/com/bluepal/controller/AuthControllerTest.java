package com.bluepal.controller;

import com.bluepal.dto.request.LoginRequest;
import com.bluepal.dto.request.RegisterRequest;
import com.bluepal.dto.request.ForgotPasswordRequest;
import com.bluepal.dto.request.ResetPasswordRequest;
import com.bluepal.entity.User;
import com.bluepal.entity.PasswordResetToken;
import com.bluepal.entity.VerificationToken;
import com.bluepal.repository.UserRepository;
import com.bluepal.repository.PasswordResetTokenRepository;
import com.bluepal.repository.VerificationTokenRepository;
import com.bluepal.security.JwtUtils;
import com.bluepal.security.CustomUserDetailsService;
import com.bluepal.security.CustomUserDetails;
import com.bluepal.service.impl.EmailServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashSet;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @MockBean
    private VerificationTokenRepository verificationTokenRepository;

    @MockBean
    private EmailServiceImpl emailService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerUser_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("Password@123");
        request.setFullName("New User");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Registration successful! You can now log in."));
    }

    @Test
    void registerUser_UsernameTaken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("takenuser");
        request.setEmail("new@example.com");
        request.setPassword("Password@123");
        request.setFullName("Taken User");

        when(userRepository.existsByUsername("takenuser")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Username is already taken!"));
    }

    @Test
    void loginUser_InvalidRequest() throws Exception {
        LoginRequest request = new LoginRequest();
        // Missing username/password

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginUser_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password");

        Authentication auth = mock(Authentication.class);
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        User userRecord = User.builder().id(123L).username("testuser").email("test@ex.com").build();

        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn(123L);
        when(userDetails.getUsername()).thenReturn("testuser");
        when(userDetails.getEmail()).thenReturn("test@ex.com");
        when(userDetails.getAuthorities()).thenReturn(List.of());
        when(jwtUtils.generateJwtToken(auth)).thenReturn("mock.jwt.token");
        when(userRepository.findById(123L)).thenReturn(Optional.of(userRecord));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void loginUser_Locked() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("locked");
        request.setPassword("password");

        when(authenticationManager.authenticate(any()))
            .thenThrow(new LockedException("Locked"));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("your account is restricted by admin"));
    }

    @Test
    void forgotPassword_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("user@example.com");
        User userRecord = User.builder().id(1L).email("user@example.com").build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(userRecord));
        when(passwordResetTokenRepository.findByUser(userRecord)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
        
        verify(emailService).sendResetPasswordEmail(eq("user@example.com"), anyString());
    }

    @Test
    void verifyRegistration_Success() throws Exception {
        VerificationToken token = new VerificationToken();
        User unverifiedUser = User.builder().username("unverified").enabled(false).build();
        token.setToken("valid-token");
        token.setUser(unverifiedUser);
        token.setExpiryDate(LocalDateTime.now().plusHours(24));

        when(verificationTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        mockMvc.perform(get("/api/auth/verify-registration")
                        .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account verified successfully! You can now log in."));

        assertTrue(unverifiedUser.isEnabled());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void changePassword_Success() throws Exception {
        User userRecord = User.builder().username("testuser").password("oldEncoded").build();
        Map<String, String> body = new HashMap<>();
        body.put("currentPassword", "oldPass");
        body.put("newPassword", "newPass123");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(userRecord));
        when(passwordEncoder.matches("oldPass", "oldEncoded")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("newEncoded");

        mockMvc.perform(post("/api/auth/change-password")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        verify(userRepository).save(userRecord);
        assertEquals("newEncoded", userRecord.getPassword());
    }

    @Test
    void deleteAccount_Success() throws Exception {
        User userRecord = User.builder().username("testuser").build();
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(userRecord));

        mockMvc.perform(delete("/api/auth/users/me")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted successfully"));

        verify(userRepository).delete(userRecord);
    }

    @Test
    void getCurrentUser_Success() throws Exception {
        User userRecord = User.builder().id(1L).username("testuser").email("test@ex.com").roles(new HashSet<>(List.of("ROLE_USER"))).build();
        Authentication auth = mock(Authentication.class);
        
        org.springframework.security.core.context.SecurityContext securityContext = mock(org.springframework.security.core.context.SecurityContext.class);
        org.springframework.security.core.context.SecurityContextHolder.setContext(securityContext);
        
        when(securityContext.getAuthentication()).thenReturn(auth);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("testuser");
        when(auth.getPrincipal()).thenReturn("testuser"); // Mock principal to avoid NPE
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(userRecord));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }
    @Test
    void registerUser_EmailTaken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setFullName("New User");
        request.setEmail("taken@example.com");
        request.setPassword("Password@123");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Email is already in use!"));
    }

    @Test
    void verifyRegistration_InvalidToken() throws Exception {
        when(verificationTokenRepository.findByToken("invalid")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/verify-registration")
                        .param("token", "invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Invalid verification token!"));
    }

    @Test
    void verifyRegistration_ExpiredToken() throws Exception {
        VerificationToken token = new VerificationToken();
        token.setExpiryDate(LocalDateTime.now().minusHours(1));
        when(verificationTokenRepository.findByToken("expired")).thenReturn(Optional.of(token));

        mockMvc.perform(get("/api/auth/verify-registration")
                        .param("token", "expired"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Verification token has expired!"));
        
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void changePassword_IncorrectCurrentPassword() throws Exception {
        User userRecord = User.builder().username("testuser").password("encoded").build();
        Map<String, String> body = new HashMap<>();
        body.put("currentPassword", "wrong");
        body.put("newPassword", "newPass123");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(userRecord));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        mockMvc.perform(post("/api/auth/change-password")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }

    @Test
    void resetPassword_Success() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-reset-token");
        request.setNewPassword("newSecret123");
        
        User user = User.builder().id(1L).username("testuser").build();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("valid-reset-token");
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(1));
        resetToken.setUser(user);

        when(passwordResetTokenRepository.findByToken("valid-reset-token")).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("newSecret123")).thenReturn("newEncoded");

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful!"));

        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).delete(resetToken);
    }

    @Test
    void getCurrentUser_Unauthenticated() throws Exception {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void handleValidationExceptions_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(""); // Invalid: Empty

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPassword_UserNotFound() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nonexistent@example.com");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: User with this email not found!"));
    }

    @Test
    void resetPassword_TokenExpired() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("newPass123");

        PasswordResetToken expiredToken = new PasswordResetToken();
        expiredToken.setExpiryDate(LocalDateTime.now().minusHours(1));

        when(passwordResetTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Token has expired"));
        
        verify(passwordResetTokenRepository).delete(expiredToken);
    }
}
