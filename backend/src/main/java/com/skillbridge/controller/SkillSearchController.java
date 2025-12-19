package com.skillbridge.controller;

import com.skillbridge.dto.SkillSearchRequest;
import com.skillbridge.dto.SkillSearchResponse;
import com.skillbridge.service.SkillSearchService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/skills")
@RequiredArgsConstructor
public class SkillSearchController {

    private final SkillSearchService skillSearchService;

    @org.springframework.web.bind.annotation.GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<List<SkillSearchResponse>> searchSkills(@org.springframework.web.bind.annotation.RequestParam("skill") String skillName) {
        SkillSearchRequest request = SkillSearchRequest.builder()
                .skillName(skillName)
                .build();
        return ResponseEntity.ok(skillSearchService.searchSkills(request));
    }
}
