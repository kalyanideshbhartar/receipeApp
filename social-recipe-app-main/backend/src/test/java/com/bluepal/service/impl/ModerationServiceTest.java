package com.bluepal.service.impl;

import com.bluepal.entity.Report;
import com.bluepal.entity.User;
import com.bluepal.repository.ReportRepository;
import com.bluepal.repository.CommentRepository;
import com.bluepal.service.interfaces.RecipeService;
import com.bluepal.service.interfaces.AdminService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ModerationServiceTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private RecipeService recipeService;
    @Mock
    private AdminService adminService;
    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private ModerationService moderationService;

    @Test
    void testReportContent() {
        User reporter = new User();
        moderationService.reportContent(reporter, "Spam", "RECIPE", 1L);
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void testGetPendingReports() {
        Report report = new Report();
        when(reportRepository.findByResolvedFalseOrderByCreatedAtDesc()).thenReturn(List.of(report));
        List<Report> reports = moderationService.getPendingReports();
        assertEquals(1, reports.size());
    }

    @Test
    void testResolveReportWithAction_DeleteRecipe() {
        Report report = Report.builder().id(1L).targetType("RECIPE").targetId(100L).build();
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        moderationService.resolveReportWithAction(1L, "DELETE", "admin", recipeService, adminService, commentRepository);

        verify(recipeService).deleteRecipe(100L, "admin");
        assertTrue(report.isResolved());
        verify(reportRepository).save(report);
    }

    @Test
    void testResolveReportWithAction_RestrictComment() {
        Report report = Report.builder().id(1L).targetType("COMMENT").targetId(200L).build();
        com.bluepal.entity.Comment comment = new com.bluepal.entity.Comment();
        User user = User.builder().username("baduser").build();
        comment.setUser(user);

        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));
        when(commentRepository.findById(200L)).thenReturn(Optional.of(comment));

        moderationService.resolveReportWithAction(1L, "RESTRICT", "admin", recipeService, adminService, commentRepository);

        verify(adminService).restrictUser("baduser", true, "admin");
    }
}
