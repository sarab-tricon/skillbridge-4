package com.skillbridge.controller;

import com.skillbridge.dto.EmployeeUtilizationResponse;
import com.skillbridge.service.AssignmentService;
import com.skillbridge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/utilization")
@RequiredArgsConstructor
public class UtilizationController {

    private final AssignmentService assignmentService;
    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<EmployeeUtilizationResponse> getMyUtilization() {
        return ResponseEntity.ok(assignmentService.getMyUtilization());
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<EmployeeUtilizationResponse>> getTeamUtilization() {
        // Fetch team members, then get utilization for each
        List<com.skillbridge.dto.UserProfileResponse> team = userService.getTeamMembers();

        List<EmployeeUtilizationResponse> utilizations = team.stream()
                .map(member -> assignmentService.getEmployeeUtilization(member.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(utilizations);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<EmployeeUtilizationResponse>> getAllUtilization() {
        List<com.skillbridge.dto.UserProfileResponse> employees = userService.getAllEmployees();

        List<EmployeeUtilizationResponse> utilizations = employees.stream()
                .map(employee -> assignmentService.getEmployeeUtilization(employee.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(utilizations);
    }
}
