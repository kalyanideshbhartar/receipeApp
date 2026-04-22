package com.bluepal.service.impl;

import com.bluepal.entity.Report;
import com.bluepal.entity.User;
import com.bluepal.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ReportRepository reportRepository;

    public void reportContent(User reporter, String reason, String targetType, Long targetId) {
        Report report = Report.builder()
                .reporter(reporter)
                .reason(reason)
                .targetType(targetType)
                .targetId(targetId)
                .build();
        reportRepository.save(report);
    }
    
    public long countPendingReports() {
        return reportRepository.countByResolvedFalse();
    }

    public List<Report> getPendingReports() {
        return reportRepository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    @Transactional
    public void resolveReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setResolved(true);
        reportRepository.save(report);
    }

    @Transactional
    public void resolveReportWithAction(Long reportId, String action, String adminUsername, 
                                        com.bluepal.service.interfaces.RecipeService recipeService,
                                        com.bluepal.service.interfaces.AdminService adminService,
                                        com.bluepal.repository.CommentRepository commentRepository) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if ("DELETE".equalsIgnoreCase(action)) {
            if ("RECIPE".equalsIgnoreCase(report.getTargetType())) {
                recipeService.deleteRecipe(report.getTargetId(), adminUsername);
            } else if ("COMMENT".equalsIgnoreCase(report.getTargetType())) {
                commentRepository.deleteById(report.getTargetId());
            }
        } else if ("RESTRICT".equalsIgnoreCase(action)) {
            if ("RECIPE".equalsIgnoreCase(report.getTargetType())) {
                com.bluepal.entity.Recipe recipe = recipeService.getRecipeEntity(report.getTargetId());
                recipe.setStatus(com.bluepal.entity.RecipeStatus.RESTRICTED);
            } else if ("COMMENT".equalsIgnoreCase(report.getTargetType())) {
                com.bluepal.entity.Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
                if (comment != null && comment.getUser() != null) {
                    adminService.restrictUser(comment.getUser().getUsername(), true, adminUsername);
                }
            }
        }

        report.setResolved(true);
        reportRepository.save(report);
    }
}
