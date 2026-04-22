package com.bluepal.repository;

import com.bluepal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findFirstByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findFirstByUsernameIgnoreCase(String username);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username) ORDER BY u.premium DESC, u.premiumExpiryDate DESC NULLS LAST")
    java.util.List<User> findAllByUsernameIgnoreCaseOrderedByPremium(@org.springframework.data.repository.query.Param("username") String username);

    default java.util.Optional<User> findFirstByUsernameIgnoreCasePrioritizePremium(String username) {
        return findAllByUsernameIgnoreCaseOrderedByPremium(username).stream().findFirst();
    }

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameIgnoreCase(String username);
}
