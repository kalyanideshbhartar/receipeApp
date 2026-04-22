package com.bluepal.repository;

import com.bluepal.entity.Follow;
import com.bluepal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    boolean existsByFollowerAndFollowing(User follower, User following);
    java.util.List<Follow> findByFollowing(User following);
    java.util.List<Follow> findByFollower(User follower);
    long countByFollower(User follower);
    long countByFollowing(User following);

    @Modifying
    @Transactional
    @Query("UPDATE Follow f SET f.follower.id = :targetId WHERE f.follower.id = :sourceId AND f.following.id NOT IN (SELECT f2.following.id FROM Follow f2 WHERE f2.follower.id = :targetId)")
    void transferFollowings(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);

    @Modifying
    @Transactional
    @Query("UPDATE Follow f SET f.following.id = :targetId WHERE f.following.id = :sourceId AND f.follower.id NOT IN (SELECT f2.follower.id FROM Follow f2 WHERE f2.following.id = :targetId)")
    void transferFollowers(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Follow f WHERE f.follower.id = :sourceId AND f.following.id IN (SELECT f2.following.id FROM Follow f2 WHERE f2.follower.id = :targetId)")
    void deleteDuplicateFollowings(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Follow f WHERE f.following.id = :sourceId AND f.follower.id IN (SELECT f2.follower.id FROM Follow f2 WHERE f2.following.id = :targetId)")
    void deleteDuplicateFollowers(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);
}
