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

        // 1. Check active assignment
        assignmentRepository.findTopByEmployeeIdOrderByStartDateDesc(currentUser.getId())
                .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
                .ifPresent(a -> {
                    throw new IllegalStateException("You already have an active assignment.");
                });

        // 2. Check for DUPLICATE pending requests (PENDING_MANAGER or PENDING_HR)
        boolean hasPending = requestRepository.existsByEmployeeIdAndStatusIn(
                currentUser.getId(),
                List.of("PENDING_MANAGER", "PENDING_HR"));

        if (hasPending) {
            return ResponseEntity.badRequest().body(Map.of("error", "You already have a pending allocation request."));
        }

        AllocationRequest req = AllocationRequest.builder()
                .employeeId(currentUser.getId())
                .projectId(projectId)
                .status("PENDING_MANAGER") // Initial status
                .createdAt(LocalDateTime.now())
                .build();

        requestRepository.save(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Request submitted to Manager"));
    }

    // EMPLOYEE: Get My Requests
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_EMPLOYEE')")
    public ResponseEntity<List<AssignmentResponse>> getMyRequests() {
        User currentUser = getAuthenticatedUser();
        List<AllocationRequest> requests = requestRepository.findByEmployeeId(currentUser.getId());

        List<AssignmentResponse> responses = requests.stream().map(req -> {
            Project project = projectRepository.findById(req.getProjectId()).orElse(null);

            AssignmentStatus dtoStatus;
            try {
                dtoStatus = AssignmentStatus.valueOf(req.getStatus());
            } catch (IllegalArgumentException e) {
                // Map custom pending statuses
                if (req.getStatus().startsWith("PENDING"))
                    dtoStatus = AssignmentStatus.PENDING;
                else
                    dtoStatus = AssignmentStatus.ENDED;
            }
            if ("REJECTED".equals(req.getStatus()))
                dtoStatus = AssignmentStatus.REJECTED;
            if ("APPROVED".equals(req.getStatus()))
                dtoStatus = AssignmentStatus.ACTIVE;

            return AssignmentResponse.builder()
                    .assignmentId(req.getId())
                    .employeeId(req.getEmployeeId())
                    .projectId(req.getProjectId())
                    .projectName(project != null ? project.getName() : "Unknown")
                    // We need to convey the specific sub-status (PENDING_MANAGER vs PENDING_HR)
                    // If DTO only supports PENDING, we lose info.
                    // Let's assume for now we just show PENDING, or I modify DTO.
                    // Provide the raw status in a way if possible.
                    .employeeName(currentUser.getFirstName() + " " + currentUser.getLastName())
                    .assignmentStatus(dtoStatus)
                    .requestStatus(req.getStatus())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // LIST PENDING REQUESTS (Role-based)
    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER', 'ROLE_HR')")
    public ResponseEntity<List<AssignmentResponse>> getPendingRequests() {
        User currentUser = getAuthenticatedUser();
        List<AllocationRequest> requests;

        if (currentUser.getRole().name().equals("MANAGER")) {
            // Filter team requests
            List<User> reports = userRepository.findAllByManagerId(currentUser.getId());
            List<UUID> reportIds = reports.stream().map(User::getId).collect(Collectors.toList());

            requests = requestRepository.findByStatus("PENDING_MANAGER").stream()
                    .filter(r -> reportIds.contains(r.getEmployeeId()))
                    .collect(Collectors.toList());

        } else if (currentUser.getRole().name().equals("HR")) {
            // HR sees PENDING_HR
            requests = requestRepository.findByStatus("PENDING_HR");
        } else {
            requests = List.of();
        }

        List<AssignmentResponse> responses = requests.stream().map(req -> {
            Project project = projectRepository.findById(req.getProjectId()).orElse(null);
            User employee = userRepository.findById(req.getEmployeeId()).orElse(null);

            // Resolve Manager Name (Forwarded By)
            String managerName = null;
            if (req.getForwardedBy() != null) {
                User manager = userRepository.findById(req.getForwardedBy()).orElse(null);
                if (manager != null) {
                    managerName = manager.getFirstName() + " " + manager.getLastName();
                }
            }

            return AssignmentResponse.builder()
                    .assignmentId(req.getId())
                    .employeeId(req.getEmployeeId())
                    .projectId(req.getProjectId())
                    .projectName(project != null ? project.getName() : "Unknown")
                    .employeeName(employee != null ? employee.getFirstName() + " " + employee.getLastName() : "Unknown")
                    .requestedAt(req.getCreatedAt())
                    .assignmentStatus(AssignmentStatus.PENDING)
                    .requestStatus(req.getStatus())
                    .billingType(req.getBillingType())
                    .managerName(managerName)
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // MANAGER: Forward to HR
    @PutMapping("/{id}/forward")
    @PreAuthorize("hasAuthority('ROLE_MANAGER')")
    @Transactional
    public ResponseEntity<?> forwardToHr(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        AllocationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        User manager = getAuthenticatedUser();

        // Validate Ownership (Employee must report to this manager)
        User employee = userRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!manager.getId().equals(employee.getManagerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only manage your own reports.");
        }

        if (!"PENDING_MANAGER".equals(req.getStatus())) {
            return ResponseEntity.badRequest().body("Request is not in pending manager state.");
        }

        // Mandatory Billing Type
        String billingTypeStr = payload.get("billingType");
        if (billingTypeStr == null) {
            return ResponseEntity.badRequest().body("Billing type is mandatory.");
        }

        try {
            req.setBillingType(BillingType.valueOf(billingTypeStr));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid billing type.");
        }

        req.setStatus("PENDING_HR");
        req.setManagerComments(payload.get("comments")); // Optional
        req.setForwardedAt(LocalDateTime.now());
        req.setForwardedBy(manager.getId());

        requestRepository.save(req);
        return ResponseEntity.ok(Map.of("message", "Forwarded to HR successfully"));
    }

    // HR: Approve & Allocate
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ROLE_HR')")
    @Transactional
    public ResponseEntity<?> approveRequest(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        AllocationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"PENDING_HR".equals(req.getStatus())) {
            return ResponseEntity.badRequest().body("Request is not pending HR approval.");
        }

        // Use stored immutable billing type
        BillingType billingType = req.getBillingType();
        if (billingType == null) {
            billingType = BillingType.BILLABLE;
        }

        User hr = getAuthenticatedUser();

        // 1. Update Request
        req.setStatus("APPROVED");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewedBy(hr.getId());
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

        return ResponseEntity.ok(Map.of("message", "Request Approved and Allocation Created"));
    }

    // MANAGER & HR: Reject
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER', 'ROLE_HR')")
    @Transactional
    public ResponseEntity<?> rejectRequest(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        AllocationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        User currentUser = getAuthenticatedUser();
        String role = currentUser.getRole().name();
        String reason = payload.get("reason");

        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Rejection reason is mandatory.");
        }

        // Validate Status transition allowability
        if ("MANAGER".equals(role) && !"PENDING_MANAGER".equals(req.getStatus())) {
            return ResponseEntity.badRequest().body("Manager can only reject requests pending manager review.");
        }
        if ("HR".equals(role) && !"PENDING_HR".equals(req.getStatus())) {
            return ResponseEntity.badRequest().body("HR can only reject requests pending HR review.");
        }

        req.setStatus("REJECTED");
        req.setRejectionReason(reason);
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewedBy(currentUser.getId());
        requestRepository.save(req);

        return ResponseEntity.ok(Map.of("message", "Request Rejected"));
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
