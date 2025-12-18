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
    public ResponseEntity<AssignmentResponse> assignEmployee(@Valid @RequestBody CreateAssignmentRequest request) {
        return new ResponseEntity<>(assignmentService.assignEmployeeToProject(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/end")
    public ResponseEntity<Void> endAssignment(@PathVariable UUID id) {
        assignmentService.endAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public ResponseEntity<AssignmentResponse> getMyAssignment() {
        AssignmentResponse response = assignmentService.getMyAssignment();
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
