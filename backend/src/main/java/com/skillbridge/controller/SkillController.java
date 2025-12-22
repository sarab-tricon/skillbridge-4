package com.skillbridge.controller;

import com.skillbridge.dto.AddSkillRequest;
import com.skillbridge.dto.SkillApprovalRequest;
import com.skillbridge.dto.SkillResponse;
import com.skillbridge.service.SkillService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<SkillResponse> addSkill(@Valid @RequestBody AddSkillRequest request) {
        return ResponseEntity.ok(skillService.addSkill(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<SkillResponse>> getMySkills() {
        return ResponseEntity.ok(skillService.getMySkills());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<SkillResponse>> getPendingSkills() {
        return ResponseEntity.ok(skillService.getPendingSkillsForManager());
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SkillResponse> verifySkill(
            @PathVariable UUID id,
            @Valid @RequestBody SkillApprovalRequest request) {
        return ResponseEntity.ok(skillService.approveSkill(id, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<SkillResponse> updateSkill(
            @PathVariable UUID id,
            @Valid @RequestBody AddSkillRequest request) {
        return ResponseEntity.ok(skillService.updateSkill(id, request));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}
