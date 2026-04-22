package com.bluepal.repository;

import com.bluepal.entity.MealPlan;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    
    @Query("SELECT m FROM MealPlan m JOIN FETCH m.recipe WHERE m.user = :user AND m.plannedDate BETWEEN :startDate AND :endDate")
    List<MealPlan> findByUserAndPlannedDateBetween(
            @Param("user") User user, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);

    List<MealPlan> findByUserAndPlannedDate(User user, LocalDate date);

    void deleteByRecipe(Recipe recipe);
}
