package com.skillbridge.controller;

import com.skillbridge.dto.AssignmentResponse;
import com.skillbridge.dto.CreateAssignmentRequest;
import com.skillbridge.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<AssignmentResponse> assignEmployee(@Valid @RequestBody CreateAssignmentRequest request) {
        return new ResponseEntity<>(assignmentService.assignEmployeeToProject(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/end")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Void> endAssignment(@PathVariable UUID id) {
        assignmentService.endAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/request")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<AssignmentResponse> requestAllocation(@RequestBody java.util.Map<String, UUID> request) {
        return new ResponseEntity<>(assignmentService.requestAllocation(request.get("projectId")), HttpStatus.CREATED);
    }

    @GetMapping("/pending")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<java.util.List<AssignmentResponse>> getPendingAssignments() {
        return ResponseEntity.ok(assignmentService.getPendingAssignments());
    }

    @PutMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<AssignmentResponse> approveAssignment(@PathVariable UUID id, @RequestBody java.util.Map<String, String> request) {
        com.skillbridge.enums.BillingType billingType = com.skillbridge.enums.BillingType.valueOf(request.get("billingType"));
        return ResponseEntity.ok(assignmentService.approveAssignment(id, billingType));
    }

    @PutMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> rejectAssignment(@PathVariable UUID id) {
        assignmentService.rejectAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<java.util.List<AssignmentResponse>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @PutMapping("/{id}/override")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<AssignmentResponse> overrideAssignment(
            @PathVariable UUID id,
            @Valid @RequestBody com.skillbridge.dto.OverrideAssignmentRequest request) {
        return ResponseEntity.ok(assignmentService.overrideAssignment(id, request));
    }
}
