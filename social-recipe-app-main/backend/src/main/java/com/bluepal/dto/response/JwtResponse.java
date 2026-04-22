package com.bluepal.dto.response;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class JwtResponse {
    private String token;
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    @JsonProperty("premium")
    private boolean premium;

    public JwtResponse() {
    }

    public JwtResponse(String token, Long id, String username, String email, String fullName, List<String> roles, boolean premium) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.premium = premium;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    @JsonProperty("premium")
    public boolean isPremium() {
        return premium;
    }

    public void setPremium(boolean premium) {
        this.premium = premium;
    }
}
