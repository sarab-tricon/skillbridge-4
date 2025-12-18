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
@RequestMapping("/utilization")
@RequiredArgsConstructor
public class UtilizationController {

    private final UtilizationService utilizationService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmployeeUtilizationResponse> getMyUtilization() {
        return ResponseEntity.ok(utilizationService.getMyUtilization());
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TeamUtilizationResponse>> getTeamUtilization() {
        return ResponseEntity.ok(utilizationService.getTeamUtilization());
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<UtilizationSummaryResponse> getSummary() {
        return ResponseEntity.ok(utilizationService.getSummary());
    }
}
