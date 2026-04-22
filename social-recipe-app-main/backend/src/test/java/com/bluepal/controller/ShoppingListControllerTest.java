package com.bluepal.controller;

import com.bluepal.dto.request.ShoppingListItemRequest;
import com.bluepal.entity.ShoppingListItem;
import com.bluepal.entity.User;
import com.bluepal.repository.UserRepository;
import com.bluepal.service.interfaces.ShoppingListService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ShoppingListController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class ShoppingListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ShoppingListService shoppingListService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.bluepal.security.JwtUtils jwtUtils;

    @MockBean
    private com.bluepal.security.CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "testuser")
    void addItem_Success() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(user));
        
        ShoppingListItem item = new ShoppingListItem();
        item.setId(1L);
        item.setName("Milk");
        
        when(shoppingListService.addItem(any(), any(), any(), any(), any())).thenReturn(item);

        ShoppingListItemRequest request = new ShoppingListItemRequest();
        request.setName("Milk");
        request.setQuantity("1");
        request.setUnit("L");

        mockMvc.perform(post("/api/shopping-list")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void getItems_Success() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(user));
        when(shoppingListService.getItems(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/shopping-list"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void togglePurchased_Success() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(user));
        
        ShoppingListItem item = new ShoppingListItem();
        item.setId(1L);
        item.setName("Milk");
        
        when(shoppingListService.togglePurchased(any(), any())).thenReturn(item);

        mockMvc.perform(patch("/api/shopping-list/1/toggle")
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteCheckedItems_Success() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(user));

        mockMvc.perform(delete("/api/shopping-list/checked")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(shoppingListService).deleteCheckedItems(user);
    }
}
