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
import com.skillbridge.repository.AllocationRequestRepository;
import com.skillbridge.entity.AllocationRequest;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final ProjectAssignmentRepository assignmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AllocationRequestRepository allocationRequestRepository;

    @Transactional
    public AssignmentResponse assignEmployeeToProject(CreateAssignmentRequest request) {
        // 1. Validate employee exists
        if (!userRepository.existsById(request.getEmployeeId())) {
            throw new RuntimeException("Employee not found with ID: " + request.getEmployeeId());
        }

        // 2. Validate project exists and is active
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + request.getProjectId()));

        if (project.getStatus() != ProjectStatus.ACTIVE && project.getStatus() != ProjectStatus.PLANNED) {
            throw new RuntimeException(
                    "Cannot assign employee to a COMPLETED project. Only ACTIVE or PLANNED projects allowed.");
        }

        // Auto-activate project if it is currently PLANNED
        if (project.getStatus() == ProjectStatus.PLANNED) {
            System.err.println("DEBUG: Auto-activating PLANNED project: " + project.getName());
            project.setStatus(ProjectStatus.ACTIVE);
            projectRepository.save(project);
        }

        // 3. Validate partial allocation - allow multiple assignments but check total
        // doesn't exceed 100%
        int requestedAllocation = request.getAllocationPercent() != null ? request.getAllocationPercent() : 100;

        // Calculate current utilization from active assignments
        int currentUtilization = assignmentRepository.findAll().stream()
                .filter(a -> a.getEmployeeId().equals(request.getEmployeeId()))
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .mapToInt(a -> a.getAllocationPercent() != null ? a.getAllocationPercent() : 100)
                .sum();

        System.err.println(
                "DEBUG: Allocation Request - Emp: " + request.getEmployeeId() + ", Proj: " + request.getProjectId());
        System.err.println("DEBUG: Current Util: " + currentUtilization + ", Requested: " + requestedAllocation);

        int totalAfterAllocation = currentUtilization + requestedAllocation;
        int availableCapacity = 100 - currentUtilization;

        if (totalAfterAllocation > 100) {
            System.err.println("DEBUG: Allocation REJECTED. Total: " + totalAfterAllocation);
            throw new IllegalStateException(
                    String.format(
                            "Cannot allocate %d%%. Employee is already %d%% allocated. Only %d%% capacity available.",
                            requestedAllocation,
                            currentUtilization,
                            availableCapacity));
        }

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
                .projectRole(request.getProjectRole() != null && !request.getProjectRole().isEmpty()
                        ? request.getProjectRole()
                        : "Team Member")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .allocationPercent(request.getAllocationPercent() != null ? request.getAllocationPercent() : 100)
                .build();

        System.err.println("DEBUG: Assigning with Role: " + assignment.getProjectRole());

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
                .requestedAt(java.time.LocalDateTime.now())
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

        User currentUser = getAuthenticatedUser();
        assignment.setAssignmentStatus(AssignmentStatus.ACTIVE);
        assignment.setBillingType(billingType);
        assignment.setReviewedAt(java.time.LocalDateTime.now());
        assignment.setReviewedBy(currentUser.getId());
        return mapToResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void rejectAssignment(UUID assignmentId) {
        ProjectAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment request not found"));

        if (assignment.getAssignmentStatus() != AssignmentStatus.PENDING) {
            throw new IllegalStateException("Can only reject pending requests");
        }

        User currentUser = getAuthenticatedUser();
        assignment.setAssignmentStatus(AssignmentStatus.REJECTED);
        assignment.setReviewedAt(java.time.LocalDateTime.now());
        assignment.setReviewedBy(currentUser.getId());
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
    public java.util.List<AssignmentResponse> getMyAssignments() {
        User currentUser = getAuthenticatedUser();
        java.util.List<AssignmentResponse> responses = new java.util.ArrayList<>();

        // 1. Active Assignments
        assignmentRepository.findByEmployeeId(currentUser.getId()).stream()
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .map(this::mapToResponse)
                .forEach(responses::add);

        // 2. Pending Requests
        allocationRequestRepository.findByEmployeeId(currentUser.getId()).stream()
                .filter(r -> "PENDING".equals(r.getStatus()))
                .map(req -> {
                    Project project = projectRepository.findById(req.getProjectId()).orElse(null);
                    return AssignmentResponse.builder()
                            .assignmentId(req.getId())
                            .employeeId(req.getEmployeeId())
                            .projectId(req.getProjectId())
                            .projectName(project != null ? project.getName() : "Requested Project")
                            .assignmentStatus(AssignmentStatus.PENDING)
                            .requestedAt(req.getCreatedAt())
                            .utilization("PENDING")
                            .build();
                })
                .forEach(responses::add);

        return responses;
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
                .utilization(String
                        .valueOf(assignment.getAllocationPercent() != null ? assignment.getAllocationPercent() : 100))
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .requestedAt(assignment.getRequestedAt())
                .projectRole(assignment.getProjectRole())
                .employeeName(userRepository.findById(assignment.getEmployeeId())
                        .map(u -> u.getFirstName() + " " + u.getLastName()).orElse("Unknown"))
                .build();
    }

    @Transactional(readOnly = true)
    public com.skillbridge.dto.EmployeeUtilizationResponse getEmployeeUtilization(UUID employeeId) {
        // Get all ACTIVE assignments for the employee
        java.util.List<ProjectAssignment> activeAssignments = assignmentRepository
                .findAll().stream()
                .filter(a -> a.getEmployeeId().equals(employeeId))
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .collect(java.util.stream.Collectors.toList());

        // Calculate total utilization
        int totalUtilization = 0;
        java.util.List<com.skillbridge.dto.AllocationDetail> assignments = new java.util.ArrayList<>();

        for (ProjectAssignment assignment : activeAssignments) {
            Project project = projectRepository.findById(assignment.getProjectId()).orElse(null);
            String projectName = project != null ? project.getName() : "Unknown Project";

            // Use actual allocation percent from the assignment, default to 100% if not set
            int allocationPercent = assignment.getAllocationPercent() != null ? assignment.getAllocationPercent() : 100;

            totalUtilization += allocationPercent;

            assignments.add(com.skillbridge.dto.AllocationDetail.builder()
                    .assignmentId(assignment.getId())
                    .projectId(assignment.getProjectId())
                    .projectName(projectName)
                    .allocationPercent(allocationPercent)
                    .billingType(assignment.getBillingType() != null ? assignment.getBillingType().name() : "NONE")
                    .projectRole(assignment.getProjectRole())
                    .startDate(assignment.getStartDate())
                    .endDate(assignment.getEndDate())
                    .build());
        }

        // Cap at 100% max
        totalUtilization = Math.min(totalUtilization, 100);
        int availableCapacity = Math.max(0, 100 - totalUtilization);

        return com.skillbridge.dto.EmployeeUtilizationResponse.builder()
                .employeeId(employeeId)
                .totalUtilization(totalUtilization)
                .availableCapacity(availableCapacity)
                .allocationStatus(totalUtilization == 0 ? "BENCH"
                        : assignments.stream().anyMatch(a -> "BILLABLE".equals(a.getBillingType())) ? "BILLABLE"
                                : "INVESTMENT")
                .projectName(assignments.isEmpty() ? null
                        : assignments.stream()
                                .map(com.skillbridge.dto.AllocationDetail::getProjectName)
                                .collect(java.util.stream.Collectors.joining(", ")))
                .assignments(assignments)
                .build();
    }

    @Transactional(readOnly = true)
    public com.skillbridge.dto.EmployeeUtilizationResponse getMyUtilization() {
        return getEmployeeUtilization(getAuthenticatedUser().getId());
    }

    @Transactional
    public AssignmentResponse updateAssignment(UUID assignmentId, com.skillbridge.dto.UpdateAssignmentRequest request) {
        ProjectAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID: " + assignmentId));

        if (assignment.getAssignmentStatus() != AssignmentStatus.ACTIVE) {
            throw new IllegalStateException("Can only update ACTIVE assignments.");
        }

        // Calculate utilization excluding current assignment
        int currentUtilization = assignmentRepository.findAll().stream()
                .filter(a -> a.getEmployeeId().equals(assignment.getEmployeeId()))
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .filter(a -> !a.getId().equals(assignmentId))
                .mapToInt(a -> a.getAllocationPercent() != null ? a.getAllocationPercent() : 100)
                .sum();

        int requestedAlloc = request.getAllocationPercent() != null ? request.getAllocationPercent()
                : (assignment.getAllocationPercent() != null ? assignment.getAllocationPercent() : 100);

        if (currentUtilization + requestedAlloc > 100) {
            throw new IllegalStateException(String.format(
                    "Cannot allocate %d%%. Employee is already %d%% allocated (excluding this). Only %d%% total capacity available.",
                    requestedAlloc, currentUtilization, (100 - currentUtilization)));
        }

        if (request.getAllocationPercent() != null)
            assignment.setAllocationPercent(request.getAllocationPercent());
        if (request.getBillingType() != null)
            assignment.setBillingType(request.getBillingType());
        if (request.getProjectRole() != null)
            assignment.setProjectRole(request.getProjectRole());
        if (request.getStartDate() != null)
            assignment.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)
            assignment.setEndDate(request.getEndDate());

        return mapToResponse(assignmentRepository.save(assignment));
    }
}
