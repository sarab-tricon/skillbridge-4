package com.skillbridge.service;

import com.skillbridge.dto.AddSkillRequest;
import com.skillbridge.dto.SkillApprovalRequest;
import com.skillbridge.dto.SkillResponse;
import com.skillbridge.entity.EmployeeSkill;
import com.skillbridge.entity.User;
import com.skillbridge.enums.SkillStatus;
import com.skillbridge.repository.EmployeeSkillRepository;
import com.skillbridge.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final EmployeeSkillRepository employeeSkillRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public SkillResponse addSkill(AddSkillRequest request) {
        User employee = getCurrentUser();

        EmployeeSkill skill = EmployeeSkill.builder()
                .employeeId(employee.getId())
                .skillName(request.getSkillName())
                .proficiencyLevel(request.getProficiencyLevel())
                .status(SkillStatus.PENDING)
                .build();

        EmployeeSkill savedSkill = employeeSkillRepository.save(skill);
        return mapToResponse(savedSkill);
    }

    public List<SkillResponse> getMySkills() {
        User employee = getCurrentUser();
        return employeeSkillRepository.findByEmployeeId(employee.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SkillResponse> getPendingSkillsForManager() {
        User manager = getCurrentUser();
        List<User> subordinates = userRepository.findAll().stream()
                .filter(u -> Objects.equals(u.getManagerId(), manager.getId()))
                .collect(Collectors.toList());

        List<UUID> subordinateIds = subordinates.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        if (subordinateIds.isEmpty()) {
            return List.of();
        }

        return employeeSkillRepository.findByStatusAndEmployeeIdIn(SkillStatus.PENDING, subordinateIds).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SkillResponse approveSkill(UUID skillId, SkillApprovalRequest request) {
        User manager = getCurrentUser();
        EmployeeSkill skill = employeeSkillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        if (!SkillStatus.PENDING.equals(skill.getStatus())) {
            throw new IllegalStateException("Only PENDING skills can be verified");
        }

        User employee = userRepository.findById(skill.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Strict Manager Validation
        if (!Objects.equals(employee.getManagerId(), manager.getId())) {
            throw new AccessDeniedException("You are not authorized to verify this skill");
        }

        skill.setStatus(request.getStatus());
        // @Version handles optimistic locking automatically
        EmployeeSkill updatedSkill = employeeSkillRepository.save(skill);

        return mapToResponse(updatedSkill);
    }

    private SkillResponse mapToResponse(EmployeeSkill skill) {
        return SkillResponse.builder()
                .id(skill.getId())
                .skillName(skill.getSkillName())
                .proficiencyLevel(skill.getProficiencyLevel())
                .status(skill.getStatus())
                .build();
    }
}
