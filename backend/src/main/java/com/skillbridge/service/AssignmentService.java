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

        // 3. Prevent duplicate ACTIVE assignments for the same employee
        assignmentRepository.findTopByEmployeeIdOrderByStartDateDesc(request.getEmployeeId())
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .ifPresent(a -> {
                    throw new IllegalStateException("Employee already has an active project assignment");
                });

        // 4. Validate dates
        if (request.getEndDate() != null && request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        // 5. Create and save assignment
        ProjectAssignment assignment = ProjectAssignment.builder()
                .employeeId(request.getEmployeeId())
                .projectId(request.getProjectId())
                .assignmentStatus(AssignmentStatus.ACTIVE)
                .billingType(request.getBillingType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
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
        assignmentRepository.findTopByEmployeeIdOrderByStartDateDesc(currentUser.getId())
                .ifPresent(a -> {
                    if (a.getAssignmentStatus() == AssignmentStatus.ACTIVE) {
                        throw new IllegalStateException("Already have an active assignment");
                    }
                    if (a.getAssignmentStatus() == AssignmentStatus.PENDING) {
                        throw new IllegalStateException("Already have a pending assignment request");
                    }
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

        java.util.Optional<ProjectAssignment> opt = assignmentRepository
                .findTopByEmployeeIdOrderByStartDateDesc(currentUser.getId());

        if (opt.isEmpty()) {
            return AssignmentResponse.builder()
                    .projectName("Bench")
                    .assignmentStatus(AssignmentStatus.ENDED)
                    .utilization("BENCH")
                    .build();
        }

        ProjectAssignment assignment = opt.get();
        return mapToResponse(assignment);
    }

    @Transactional(readOnly = true)
    public com.skillbridge.dto.AllocationResponse getMyAllocation(UUID employeeId) {
        java.util.Optional<ProjectAssignment> opt = assignmentRepository
                .findTopByEmployeeIdOrderByStartDateDesc(employeeId);

        if (opt.isEmpty()) {
            return com.skillbridge.dto.AllocationResponse.bench();
        }

        ProjectAssignment assignment = opt.get();

        if (assignment.getAssignmentStatus() != AssignmentStatus.ACTIVE) {
            return com.skillbridge.dto.AllocationResponse.bench();
        }

        // Map to AllocationResponse and enrich with project name
        com.skillbridge.dto.AllocationResponse response = com.skillbridge.dto.AllocationResponse.from(assignment);
        Project project = projectRepository.findById(assignment.getProjectId()).orElse(null);
        if (project != null) {
            response.setProjectName(project.getName());
        }
        return response;
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        if (principal instanceof String email) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
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
