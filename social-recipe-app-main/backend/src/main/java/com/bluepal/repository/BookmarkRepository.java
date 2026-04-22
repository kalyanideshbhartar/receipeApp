package com.bluepal.repository;

import com.bluepal.entity.Bookmark;
import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserOrderByCreatedAtDesc(User user);

    Optional<Bookmark> findByUserAndRecipe(User user, Recipe recipe);
    Optional<Bookmark> findFirstByUserAndRecipeOrderByCreatedAtDesc(User user, Recipe recipe);

    boolean existsByUserAndRecipe(User user, Recipe recipe);

    @Modifying
    @Transactional
    void deleteByUserAndRecipe(User user, Recipe recipe);

    @Modifying
    @Transactional
    void deleteByRecipe(Recipe recipe);

    @Modifying
    @Transactional
    @Query("UPDATE Bookmark b SET b.user.id = :targetId WHERE b.user.id = :sourceId AND b.recipe.id NOT IN (SELECT b2.recipe.id FROM Bookmark b2 WHERE b2.user.id = :targetId)")
    void updateUserForBookmarks(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Bookmark b WHERE b.user.id = :sourceId AND b.recipe.id IN (SELECT b2.recipe.id FROM Bookmark b2 WHERE b2.user.id = :targetId)")
    void deleteDuplicateBookmarks(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);
}
