package com.bluepal.repository;

import com.bluepal.entity.Recipe;
import com.bluepal.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long>, JpaSpecificationExecutor<Recipe> {

    // Cursor-based Explore Feed
    // Cursor-based Explore Feed (Published Only)
    @Query("SELECT r FROM Recipe r WHERE r.isPublished = true AND r.createdAt < :cursor ORDER BY r.createdAt DESC")
    List<Recipe> findExploreCursorPublished(@Param("cursor") LocalDateTime cursor, Pageable pageable);

    // Initial load for Explore Feed (Published Only)
    List<Recipe> findAllByIsPublishedTrueOrderByCreatedAtDesc(Pageable pageable);

    // Cursor-based Personalized Feed
    @Query("SELECT r FROM Recipe r WHERE r.author IN " +
           "(SELECT f.following FROM Follow f WHERE f.follower = :user) " +
           "AND r.createdAt < :cursor ORDER BY r.createdAt DESC")
    List<Recipe> findPersonalizedCursor(@Param("user") User user, @Param("cursor") LocalDateTime cursor, Pageable pageable);

    // Initial load for Personalized Feed
    @Query("SELECT r FROM Recipe r WHERE r.author IN " +
           "(SELECT f.following FROM Follow f WHERE f.follower = :user) " +
           "ORDER BY r.createdAt DESC")
    List<Recipe> findPersonalizedLatest(@Param("user") User user, Pageable pageable);

    // Trending recipes based on likes and rating (simplified)
    @Query("SELECT r FROM Recipe r ORDER BY (r.likeCount + r.ratingCount) DESC")
    List<Recipe> findTrending(Pageable pageable);

    List<Recipe> findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(com.bluepal.entity.Category category, Pageable pageable);

    @Query("SELECT r FROM Recipe r WHERE r.category = :category AND r.isPublished = true AND r.createdAt < :cursor ORDER BY r.createdAt DESC")
    List<Recipe> findExploreCursorWithCategoryPublished(@Param("category") com.bluepal.entity.Category category, @Param("cursor") LocalDateTime cursor, Pageable pageable);

    // Optimized full-text search using GIN indexes and tsvector
    @Query(value = "SELECT DISTINCT r.* FROM recipes r " +
           "LEFT JOIN users u ON r.author_id = u.id " +
           "LEFT JOIN ingredients i ON r.id = i.recipe_id " +
           "WHERE r.is_published = true AND (" +
           "   to_tsvector('english', r.title) @@ plainto_tsquery('english', :query) " +
           "   OR to_tsvector('english', r.description) @@ plainto_tsquery('english', :query) " +
           "   OR u.username ILIKE CONCAT('%', :query, '%') " +
           "   OR to_tsvector('english', i.name) @@ plainto_tsquery('english', :query) " +
           ") " +
           "ORDER BY r.created_at DESC", nativeQuery = true)
    List<Recipe> searchRecipesFullText(@Param("query") String query);

    // Optimized user recipe lists
    List<Recipe> findByAuthor(User author);
    List<Recipe> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);

    List<Recipe> findByAuthorAndIsPublishedTrueOrderByCreatedAtDesc(User author, Pageable pageable);
    
    long countByAuthor(User author);

    @Query("SELECT r FROM Recipe r WHERE r.author = :author AND r.createdAt < :cursor ORDER BY r.createdAt DESC")
    List<Recipe> findUserRecipesCursor(@Param("author") User author, @Param("cursor") LocalDateTime cursor, Pageable pageable);

    @Query("SELECT r FROM Recipe r WHERE r.author = :author AND r.isPublished = true AND r.createdAt < :cursor ORDER BY r.createdAt DESC")
    List<Recipe> findUserRecipesCursorPublished(@Param("author") User author, @Param("cursor") LocalDateTime cursor, Pageable pageable);

    @Query("SELECT r FROM Recipe r JOIN Like l ON l.recipe = r WHERE l.user = :user ORDER BY r.createdAt DESC")
    List<Recipe> findLikedRecipesByUser(@Param("user") User user, Pageable pageable);

    @Query("SELECT r FROM Recipe r JOIN Like l ON l.recipe = r WHERE l.user = :user AND r.createdAt < :cursor ORDER BY r.createdAt DESC")
    List<Recipe> findLikedRecipesCursor(@Param("user") User user, @Param("cursor") LocalDateTime cursor, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Recipe r SET r.likeCount = r.likeCount + 1 WHERE r.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Recipe r SET r.likeCount = CASE WHEN r.likeCount > 0 THEN r.likeCount - 1 ELSE 0 END WHERE r.id = :id")
    void decrementLikeCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Recipe r SET r.commentCount = r.commentCount + 1 WHERE r.id = :id")
    void incrementCommentCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Recipe r SET r.commentCount = CASE WHEN r.commentCount > 0 THEN r.commentCount - 1 ELSE 0 END WHERE r.id = :id")
    void decrementCommentCount(@Param("id") Long id);
}