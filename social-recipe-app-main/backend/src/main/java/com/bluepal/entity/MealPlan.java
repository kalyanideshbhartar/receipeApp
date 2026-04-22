package com.bluepal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Column(name = "meal_type", nullable = false, length = 20) // BREAKFAST, LUNCH, DINNER, SNACK
    private String mealType;

    @Column(name = "servings_adjustment")
    @Builder.Default
    private Integer servingsAdjustment = 0; // +/- from recipe portions

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private MealPlanStatus status = MealPlanStatus.PLANNED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
