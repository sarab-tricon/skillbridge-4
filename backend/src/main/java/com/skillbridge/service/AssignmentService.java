package com.skillbridge.service;

import com.skillbridge.dto.AssignmentResponse;
import com.skillbridge.dto.CreateAssignmentRequest;
import com.skillbridge.entity.Project;
import com.skillbridge.entity.ProjectAssignment;
import com.skillbridge.entity.User;
import com.skillbridge.enums.AssignmentStatus;
import com.skillbridge.enums.ProjectStatus;
import com.skillbridge.repository.ProjectAssignmentRepository;
import com.skillbridge.repository.ProjectRepository;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final ProjectAssignmentRepository assignmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public AssignmentResponse assignEmployeeToProject(CreateAssignmentRequest request) {
        // 1. Validate employee exists
        if (!userRepository.existsById(request.getEmployeeId())) {
            throw new RuntimeException("Employee not found with ID: " + request.getEmployeeId());
        }

        // 2. Validate project exists and is active
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + request.getProjectId()));

        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new RuntimeException("Cannot assign employee to a non-active project");
        }

        // 3. Check for existing active assignment
        assignmentRepository.findByEmployeeIdAndAssignmentStatus(request.getEmployeeId(), AssignmentStatus.ACTIVE)
                .ifPresent(a -> {
                    throw new IllegalStateException("Employee already has an active project assignment");
                });

        // 4. Create and save assignment
        ProjectAssignment assignment = ProjectAssignment.builder()
                .employeeId(request.getEmployeeId())
                .projectId(request.getProjectId())
                .assignmentStatus(AssignmentStatus.ACTIVE)
                .billingType(request.getBillingType())
                .startDate(LocalDate.now())
                .build();

        ProjectAssignment savedAssignment = assignmentRepository.save(assignment);
        return mapToResponse(savedAssignment);
    }

    @Transactional
    public void endAssignment(UUID assignmentId) {
        ProjectAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID: " + assignmentId));

        if (assignment.getAssignmentStatus() == AssignmentStatus.ENDED) {
            throw new RuntimeException("Assignment is already ended");
        }

        assignment.setAssignmentStatus(AssignmentStatus.ENDED);
        assignment.setEndDate(LocalDate.now());
        assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public AssignmentResponse getMyAssignment() {
        User currentUser = getAuthenticatedUser();
        return assignmentRepository.findByEmployeeIdAndAssignmentStatus(currentUser.getId(), AssignmentStatus.ACTIVE)
                .map(this::mapToResponse)
                .orElse(null);
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        throw new RuntimeException("User not authenticated");
    }

    private AssignmentResponse mapToResponse(ProjectAssignment assignment) {
        return AssignmentResponse.builder()
                .assignmentId(assignment.getId())
                .employeeId(assignment.getEmployeeId())
                .projectId(assignment.getProjectId())
                .billingType(assignment.getBillingType())
                .assignmentStatus(assignment.getAssignmentStatus())
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .build();
    }
}
