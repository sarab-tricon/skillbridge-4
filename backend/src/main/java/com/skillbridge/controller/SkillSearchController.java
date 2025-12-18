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

    @PostMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<List<SkillSearchResponse>> searchSkills(@RequestBody SkillSearchRequest request) {
        return ResponseEntity.ok(skillSearchService.searchSkills(request));
    }
}
