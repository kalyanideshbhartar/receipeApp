package com.bluepal.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PremiumRequiredExceptionTest {

    @Test
    void testPremiumRequiredException() {
        String message = "Premium required to access this recipe";
        PremiumRequiredException exception = new PremiumRequiredException(message);
        assertEquals(message, exception.getMessage());
    }
}
