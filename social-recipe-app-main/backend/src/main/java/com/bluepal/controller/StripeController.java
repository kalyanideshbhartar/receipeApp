package com.bluepal.controller;

import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.extern.slf4j.Slf4j;
import com.bluepal.dto.response.MessageResponse;
import com.bluepal.exception.ResourceNotFoundException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/payments")
public class StripeController {
    
    private static final String USERNAME_KEY = "username";

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    private final UserRepository userRepository;

    public StripeController(UserRepository userRepository, @Value("${stripe.api.key}") String stripeApiKey) {
        this.userRepository = userRepository;
        Stripe.apiKey = stripeApiKey;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Object> createCheckoutSession() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = auth.getName();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().hasActivePremium()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse("You already have an active premium membership. No need to pay again."));
        }

        User user = userOpt.orElseThrow(() -> new ResourceNotFoundException("User", USERNAME_KEY, username));
        Long userId = user.getId();

        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://172.30.224.1:5173/profile/" + userId + "?upgrade=success&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl("http://172.30.224.1:5173/profile/" + userId + "?upgrade=cancel")
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(49900L) // ₹499.00
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Culinario Premium Plus Membership")
                                        .setDescription("Unlock unlimited exclusive recipes and pro-chef community highlights")
                                        .build())
                                .build())
                        .build())
                .putMetadata(USERNAME_KEY, username)
                .build();

        try {
            Session session = Session.create(params);
            Map<String, String> responseData = new HashMap<>();
            responseData.put("id", session.getId());
            responseData.put("url", session.getUrl());
            return ResponseEntity.ok(responseData);
        } catch (StripeException e) {
            log.error("Stripe session creation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                String username = session.getMetadata().get(USERNAME_KEY);
                upgradeUserToPremium(username);
            }
        }

        return ResponseEntity.ok("Received");
    }

    private void upgradeUserToPremium(String username) {
        if (username == null) return;
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Prevent duplicated expiry increments if they accidentally verify multiple times
            if (!user.hasActivePremium()) {
                user.setPremium(true);
                user.setPremiumExpiryDate(java.time.LocalDateTime.now().plusDays(30));
                userRepository.save(user);
                log.info("SUCCESS: User {} upgraded to Premium via Stripe. Valid until: {}", username, user.getPremiumExpiryDate());
            }
        }
    }

    @GetMapping("/verify-session")
    public ResponseEntity<Object> verifySession(@RequestParam("session_id") String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            if ("paid".equals(session.getPaymentStatus())) {
                String username = session.getMetadata().get(USERNAME_KEY);
                upgradeUserToPremium(username);
                return ResponseEntity.ok(new MessageResponse("Payment verified and user upgraded successfully."));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
        } catch (StripeException e) {
            log.error("Stripe session verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
