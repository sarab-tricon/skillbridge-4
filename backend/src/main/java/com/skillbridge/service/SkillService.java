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

        // Check for uniqueness
        if (employeeSkillRepository.existsByEmployeeIdAndSkillNameIgnoreCase(employee.getId(),
                request.getSkillName())) {
            throw new RuntimeException("You have already added the skill: " + request.getSkillName());
        }

        // Managers get auto-approved skills, employees need manager approval
        SkillStatus initialStatus = (employee.getRole() == com.skillbridge.enums.Role.MANAGER)
                ? SkillStatus.APPROVED
                : SkillStatus.PENDING;

        EmployeeSkill skill = EmployeeSkill.builder()
                .employeeId(employee.getId())
                .skillName(request.getSkillName())
                .proficiencyLevel(request.getProficiencyLevel())
                .status(initialStatus)
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
    public SkillResponse updateSkill(UUID skillId, AddSkillRequest request) {
        User employee = getCurrentUser();
        EmployeeSkill skill = employeeSkillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        if (!Objects.equals(skill.getEmployeeId(), employee.getId())) {
            throw new AccessDeniedException("You are not authorized to update this skill");
        }

        // Check for uniqueness if name changed
        if (!skill.getSkillName().equalsIgnoreCase(request.getSkillName())) {
            if (employeeSkillRepository.existsByEmployeeIdAndSkillNameIgnoreCase(employee.getId(),
                    request.getSkillName())) {
                throw new RuntimeException("You already have a skill named: " + request.getSkillName());
            }
        }

        skill.setSkillName(request.getSkillName());
        skill.setProficiencyLevel(request.getProficiencyLevel());
        // Managers get auto-approved, employees need manager approval
        skill.setStatus(employee.getRole() == com.skillbridge.enums.Role.MANAGER
                ? SkillStatus.APPROVED
                : SkillStatus.PENDING);

        EmployeeSkill updated = employeeSkillRepository.save(skill);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteSkill(UUID skillId) {
        User employee = getCurrentUser();
        EmployeeSkill skill = employeeSkillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        if (!Objects.equals(skill.getEmployeeId(), employee.getId())) {
            throw new AccessDeniedException("You are not authorized to delete this skill");
        }

        if (skill.getStatus() != SkillStatus.PENDING) {
            throw new RuntimeException("Only pending skills can be deleted. Approved or Rejected skills are locked.");
        }

        employeeSkillRepository.delete(skill);
    }

    private SkillResponse mapToResponse(EmployeeSkill skill) {
        User employee = userRepository.findById(skill.getEmployeeId())
                .orElse(null);

        return SkillResponse.builder()
                .id(skill.getId())
                .employeeId(skill.getEmployeeId())
                .employeeName(employee != null ? employee.getEmail().split("@")[0] : "Unknown") // Best effort for name
                .employeeEmail(employee != null ? employee.getEmail() : "Unknown")
                .skillName(skill.getSkillName())
                .proficiencyLevel(skill.getProficiencyLevel())
                .status(skill.getStatus())
                .build();
    }
}
