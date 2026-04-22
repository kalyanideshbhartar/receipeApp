package com.bluepal.repository;

import com.bluepal.entity.Rating;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserAndRecipe(User user, Recipe recipe);
    Optional<Rating> findFirstByUserAndRecipeOrderByCreatedAtDesc(User user, Recipe recipe);

    boolean existsByUserAndRecipe(User user, Recipe recipe);

    long countByRecipe(Recipe recipe);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.recipe = :recipe")
    Double getAverageRatingByRecipe(@Param("recipe") Recipe recipe);

    @Modifying
    @Transactional
    void deleteByRecipe(Recipe recipe);

    @Modifying
    @Transactional
    @Query("UPDATE Rating r SET r.user.id = :targetId WHERE r.user.id = :sourceId AND r.recipe.id NOT IN (SELECT r2.recipe.id FROM Rating r2 WHERE r2.user.id = :targetId)")
    void updateUserForRatings(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Rating r WHERE r.user.id = :sourceId AND r.recipe.id IN (SELECT r2.recipe.id FROM Rating r2 WHERE r2.user.id = :targetId)")
    void deleteDuplicateRatings(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);
}
