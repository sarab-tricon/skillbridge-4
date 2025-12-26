package com.skillbridge.controller;

import com.skillbridge.dto.AssignmentResponse;
import com.skillbridge.dto.CreateAssignmentRequest;
import com.skillbridge.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.UUID;

import com.skillbridge.dto.UpdateAssignmentRequest;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssignmentResponse> assignEmployee(@Valid @RequestBody CreateAssignmentRequest request) {
        return new ResponseEntity<>(assignmentService.assignEmployeeToProject(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Void> endAssignment(@PathVariable UUID id) {
        assignmentService.endAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<AssignmentResponse> updateAssignment(@PathVariable UUID id,
            @RequestBody UpdateAssignmentRequest request) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<java.util.List<AssignmentResponse>> getMyAssignments() {
        return ResponseEntity.ok(assignmentService.getMyAssignments());
    }

    @GetMapping("/employee/{employeeId}/utilization")
    public ResponseEntity<com.skillbridge.dto.EmployeeUtilizationResponse> getEmployeeUtilization(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(assignmentService.getEmployeeUtilization(employeeId));
    }
}
