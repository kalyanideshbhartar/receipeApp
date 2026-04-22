package com.bluepal.repository;

import com.bluepal.entity.Notification;
import com.bluepal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);
    List<Notification> findByRecipientAndReadOrderByCreatedAtDesc(User recipient, boolean read);
    long countByRecipientAndRead(User recipient, boolean read);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByRecipeId(Long recipeId);
}
