package com.skillbridge.controller;

import com.skillbridge.dto.AssignmentResponse;
import com.skillbridge.entity.AllocationRequest;
import com.skillbridge.entity.Project;
import com.skillbridge.entity.ProjectAssignment;
import com.skillbridge.entity.User;
import com.skillbridge.enums.AssignmentStatus;
import com.skillbridge.enums.BillingType;
import com.skillbridge.repository.AllocationRequestRepository;
import com.skillbridge.repository.ProjectAssignmentRepository;
import com.skillbridge.repository.ProjectRepository;
import com.skillbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/allocation-requests")
@RequiredArgsConstructor
public class AllocationRequestController {

    private final AllocationRequestRepository requestRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    // EMPLOYEE: Create Request
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_EMPLOYEE')")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, String> payload) {
        UUID projectId = UUID.fromString(payload.get("projectId"));
        User currentUser = getAuthenticatedUser();

        // Check active assignment
        assignmentRepository.findTopByEmployeeIdOrderByStartDateDesc(currentUser.getId())
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .ifPresent(a -> {
                    throw new IllegalStateException("You already have an active assignment.");
                });

        // Check pending request
        // (A real app might check for DUPLICATE pending requests too)

        AllocationRequest req = AllocationRequest.builder()
                .employeeId(currentUser.getId())
                .projectId(projectId)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        requestRepository.save(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Request submitted successfully"));
    }

    // MANAGER: Get Pending
    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER', 'ROLE_HR')")
    public ResponseEntity<List<AssignmentResponse>> getPendingRequests() {
        List<AllocationRequest> requests = requestRepository.findByStatus("PENDING");

        List<AssignmentResponse> responses = requests.stream().map(req -> {
            Project project = projectRepository.findById(req.getProjectId()).orElse(null);
            User employee = userRepository.findById(req.getEmployeeId()).orElse(null);

            return AssignmentResponse.builder()
                    .assignmentId(req.getId()) // Use Request ID as ID for the UI
                    .employeeId(req.getEmployeeId())
                    .projectId(req.getProjectId())
                    .projectName(project != null ? project.getName() : "Unknown")
                    .employeeName(employee != null ? employee.getFirstName() + " " + employee.getLastName() : "Unknown")
                    .requestedAt(req.getCreatedAt())
                    .assignmentStatus(AssignmentStatus.PENDING) // Reuse Enum for UI compatibility
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // MANAGER: Approve
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER', 'ROLE_HR')")
    @Transactional
    public ResponseEntity<?> approveRequest(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        AllocationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"PENDING".equals(req.getStatus())) {
            return ResponseEntity.badRequest().body("Request is not pending");
        }

        BillingType billingType = BillingType.valueOf(payload.getOrDefault("billingType", "BILLABLE"));
        User manager = getAuthenticatedUser();

        // 1. Update Request
        req.setStatus("APPROVED");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewedBy(manager.getId());
        requestRepository.save(req);

        // 2. Create Real Assignment
        ProjectAssignment assignment = ProjectAssignment.builder()
                .employeeId(req.getEmployeeId())
                .projectId(req.getProjectId())
                .assignmentStatus(AssignmentStatus.ACTIVE)
                .billingType(billingType)
                .startDate(LocalDate.now())
                .build();

        assignmentRepository.save(assignment);

        return ResponseEntity.ok(Map.of("message", "Approved"));
    }

    // MANAGER: Reject
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER', 'ROLE_HR')")
    @Transactional
    public ResponseEntity<?> rejectRequest(@PathVariable UUID id) {
        AllocationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        User manager = getAuthenticatedUser();
        req.setStatus("REJECTED");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewedBy(manager.getId());
        requestRepository.save(req);

        return ResponseEntity.ok(Map.of("message", "Rejected"));
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
