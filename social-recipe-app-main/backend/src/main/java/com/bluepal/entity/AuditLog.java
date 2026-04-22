package com.bluepal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g., "MERGE_USERS", "PREMIUM_OVERRIDE", "RESTRICT_USER"

    @Column(nullable = false)
    private String performedBy; // Admin username

    @Column(nullable = false)
    private String target; // e.g., "User: ankit", "Recipe: Pasta"

    @Column(columnDefinition = "TEXT")
    private String details; // Detailed JSON snapshot or reason

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
