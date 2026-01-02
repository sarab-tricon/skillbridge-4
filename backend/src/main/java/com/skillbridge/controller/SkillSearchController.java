package com.skillbridge.controller;

import com.skillbridge.dto.SkillSearchRequest;
import com.skillbridge.dto.SkillSearchResponse;
import com.skillbridge.service.SkillSearchService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillSearchController {

    private final SkillSearchService skillSearchService;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<List<SkillSearchResponse>> searchSkills(
            @RequestParam(value = "skills", required = false) List<String> skillNames,
            @RequestParam(value = "skill", required = false) String skillName) {
        SkillSearchRequest request = SkillSearchRequest.builder()
                .skillName(skillName)
                .skillNames(skillNames)
                .build();
        return ResponseEntity.ok(skillSearchService.searchSkills(request));
    }
}
