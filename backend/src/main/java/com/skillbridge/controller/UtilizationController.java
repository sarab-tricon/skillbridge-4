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
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
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
        // Get both employees and managers for utilization tracking
        List<com.skillbridge.dto.UserProfileResponse> employees = userService.getAllEmployees();
        List<com.skillbridge.dto.UserProfileResponse> managers = userService.getManagers();

        // Combine employees and managers
        java.util.List<com.skillbridge.dto.UserProfileResponse> allUsers = new java.util.ArrayList<>();
        allUsers.addAll(employees);
        allUsers.addAll(managers);

        List<EmployeeUtilizationResponse> utilizations = allUsers.stream()
                .map(user -> assignmentService.getEmployeeUtilization(user.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(utilizations);
    }
}
