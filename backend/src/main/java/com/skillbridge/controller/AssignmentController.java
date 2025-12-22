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

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<AssignmentResponse> assignEmployee(@Valid @RequestBody CreateAssignmentRequest request) {
        return new ResponseEntity<>(assignmentService.assignEmployeeToProject(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Void> endAssignment(@PathVariable UUID id) {
        assignmentService.endAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<AssignmentResponse> getMyAssignment() {
        return ResponseEntity.ok(assignmentService.getMyAssignment());
    }
}
