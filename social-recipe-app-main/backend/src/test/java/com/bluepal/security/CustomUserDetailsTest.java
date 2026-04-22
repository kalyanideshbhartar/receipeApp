package com.bluepal.security;

import com.bluepal.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CustomUserDetailsTest {

    @Test
    void testCustomUserDetails() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("password");
        user.setRoles(Collections.singleton("ROLE_USER"));
        user.setRestricted(false);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertEquals(1L, userDetails.getId());
        assertEquals("testuser", userDetails.getUsername());
        assertEquals("password", userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_USER")));
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());
        assertTrue(userDetails.isEnabled());
    }

    @Test
    void testCustomUserDetailsRestricted() {
        User user = new User();
        user.setId(2L);
        user.setUsername("restricteduser");
        user.setRoles(new HashSet<>());
        user.setRestricted(true);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertFalse(userDetails.isAccountNonLocked());
        assertFalse(userDetails.isEnabled());
    }
}
