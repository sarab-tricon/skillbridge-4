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

    @Transactional
    public AssignmentResponse requestAllocation(UUID projectId) {
        User currentUser = getAuthenticatedUser();

        // 1. Validate project exists and is active
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new RuntimeException("Cannot request allocation for a non-active project");
        }

        // 2. Check for existing active or pending assignment
        assignmentRepository.findByEmployeeIdAndAssignmentStatus(currentUser.getId(), AssignmentStatus.ACTIVE)
                .ifPresent(a -> {
                    throw new IllegalStateException("Already have an active assignment");
                });

        assignmentRepository.findByEmployeeIdAndAssignmentStatus(currentUser.getId(), AssignmentStatus.PENDING)
                .ifPresent(a -> {
                    throw new IllegalStateException("Already have a pending assignment request");
                });

        // 3. Create and save pending assignment
        ProjectAssignment assignment = ProjectAssignment.builder()
                .employeeId(currentUser.getId())
                .projectId(projectId)
                .assignmentStatus(AssignmentStatus.PENDING)
                .billingType(null) // Not assigned yet
                .startDate(LocalDate.now())
                .build();

        return mapToResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public AssignmentResponse approveAssignment(UUID assignmentId, com.skillbridge.enums.BillingType billingType) {
        ProjectAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment request not found"));

        if (assignment.getAssignmentStatus() != AssignmentStatus.PENDING) {
            throw new IllegalStateException("Can only approve pending requests");
        }

        assignment.setAssignmentStatus(AssignmentStatus.ACTIVE);
        assignment.setBillingType(billingType);
        return mapToResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void rejectAssignment(UUID assignmentId) {
        ProjectAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment request not found"));

        if (assignment.getAssignmentStatus() != AssignmentStatus.PENDING) {
            throw new IllegalStateException("Can only reject pending requests");
        }

        assignment.setAssignmentStatus(AssignmentStatus.REJECTED);
        assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public java.util.List<AssignmentResponse> getPendingAssignments() {
        // In a real system, we'd filter by manager's team members
        return assignmentRepository.findAll().stream()
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.PENDING)
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssignmentResponse getMyAssignment() {
        User currentUser = getAuthenticatedUser();
        // Return most relevant assignment (Active, else Pending, else Rejected)
        java.util.List<ProjectAssignment> assignments = assignmentRepository.findByEmployeeId(currentUser.getId());

        return assignments.stream()
                .sorted((a1, a2) -> {
                    // Quick priority: ACTIVE (0) > PENDING (1) > REJECTED (2) > ENDED (3)
                    int p1 = getStatusPriority(a1.getAssignmentStatus());
                    int p2 = getStatusPriority(a2.getAssignmentStatus());
                    return Integer.compare(p1, p2);
                })
                .findFirst()
                .map(this::mapToResponse)
                .orElse(AssignmentResponse.builder()
                        .projectName("Bench")
                        .assignmentStatus(AssignmentStatus.ENDED)
                        .utilization("BENCH")
                        .build());
    }

    private int getStatusPriority(AssignmentStatus status) {
        switch (status) {
            case ACTIVE:
                return 0;
            case PENDING:
                return 1;
            case REJECTED:
                return 2;
            case ENDED:
                return 3;
            default:
                return 4;
        }
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        throw new RuntimeException("User not authenticated");
    }

    private AssignmentResponse mapToResponse(ProjectAssignment assignment) {
        Project project = projectRepository.findById(assignment.getProjectId()).orElse(null);
        String projectName = project != null ? project.getName() : "Unknown Project";

        String billingStr = assignment.getBillingType() != null ? assignment.getBillingType().name() : "NONE";

        return AssignmentResponse.builder()
                .assignmentId(assignment.getId())
                .employeeId(assignment.getEmployeeId())
                .projectId(assignment.getProjectId())
                .projectName(projectName)
                .billingType(assignment.getBillingType())
                .assignmentStatus(assignment.getAssignmentStatus())
                .utilization(billingStr) // String as requested
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .build();
    }
}
