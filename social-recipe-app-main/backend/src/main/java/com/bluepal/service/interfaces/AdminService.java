package com.bluepal.service.interfaces;

import com.bluepal.entity.AuditLog;
import java.util.List;

public interface AdminService {
    void mergeUsers(String sourceUsername, String targetUsername, String adminUsername);
    void updatePremiumStatus(String username, boolean isPremium, Integer durationDays, String adminUsername);
    List<AuditLog> getAuditLogs();
    void restrictUser(String username, boolean restricted, String adminUsername);
}
