package com.skillbridge.controller;

import com.skillbridge.entity.Skill;
import com.skillbridge.service.SkillCatalogService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog/skills")
@RequiredArgsConstructor
public class SkillCatalogController {

    private final SkillCatalogService skillCatalogService;

    @GetMapping
    public ResponseEntity<List<Skill>> getAllSkills() {
        return ResponseEntity.ok(skillCatalogService.getAllSkills());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Skill> addSkill(@RequestBody Skill skill) {
        return ResponseEntity.ok(skillCatalogService.addSkill(skill));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        skillCatalogService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}
