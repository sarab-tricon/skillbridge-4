package com.skillbridge.service;

import com.skillbridge.entity.Skill;
import com.skillbridge.repository.SkillRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SkillCatalogService {

    private final SkillRepository skillRepository;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    @Transactional
    public Skill addSkill(Skill skill) {
        if (skillRepository.existsByNameIgnoreCase(skill.getName())) {
            throw new RuntimeException("Skill with this name already exists");
        }
        return skillRepository.save(skill);
    }

    @Transactional
    public void deleteSkill(UUID id) {
        skillRepository.deleteById(id);
    }
}
