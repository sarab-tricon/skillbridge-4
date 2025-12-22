package com.skillbridge.controller;

import com.skillbridge.dto.EmployeeUtilizationResponse;
import com.skillbridge.dto.TeamUtilizationResponse;
import com.skillbridge.dto.UtilizationSummaryResponse;
import com.skillbridge.service.UtilizationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UtilizationController {

    private final UtilizationService utilizationService;
    private final com.skillbridge.service.AssignmentService assignmentService;
    private final com.skillbridge.repository.UserRepository userRepository;

    @GetMapping("/utilization/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmployeeUtilizationResponse> getMyUtilization() {
        return ResponseEntity.ok(utilizationService.getMyUtilization());
    }

    @GetMapping("/allocations/me")
    @PreAuthorize("hasAnyAuthority('ROLE_EMPLOYEE','ROLE_MANAGER')")
    public com.skillbridge.dto.AllocationResponse getMyAllocation() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        com.skillbridge.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return assignmentService.getMyAllocation(user.getId());
    }

    @GetMapping("/utilization/team")
    @PreAuthorize("hasAuthority('ROLE_MANAGER')")
    public ResponseEntity<List<TeamUtilizationResponse>> getTeamUtilization() {
        return ResponseEntity.ok(utilizationService.getTeamUtilization());
    }

    @GetMapping("/utilization/summary")
    @PreAuthorize("hasAuthority('ROLE_HR')")
    public ResponseEntity<UtilizationSummaryResponse> getSummary() {
        return ResponseEntity.ok(utilizationService.getSummary());
    }
}
