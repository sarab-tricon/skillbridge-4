package com.skillbridge.service;

import com.skillbridge.dto.SkillSearchRequest;
import com.skillbridge.dto.SkillSearchResponse;
import com.skillbridge.entity.EmployeeSkill;
import com.skillbridge.entity.User;
import com.skillbridge.enums.ProficiencyLevel;
import com.skillbridge.enums.Role;
import com.skillbridge.enums.SkillStatus;
import com.skillbridge.repository.EmployeeSkillRepository;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.security.CustomUserDetails;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SkillSearchService {

    private final EmployeeSkillRepository employeeSkillRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SkillSearchResponse> searchSkills(SkillSearchRequest request) {
        User currentUser = getAuthenticatedUser();
        Role currentUserRole = currentUser.getRole();

        // 1. Fetch APPROVED skills by skill name
        List<EmployeeSkill> skills = employeeSkillRepository.findBySkillNameIgnoreCaseAndStatus(
                request.getSkillName(),
                SkillStatus.APPROVED
        );

        if (skills.isEmpty()) {
            return List.of();
        }

        // 2. Fetch Users associated with these skills
        Set<UUID> employeeIds = skills.stream()
                .map(EmployeeSkill::getEmployeeId)
                .collect(Collectors.toSet());
        
        // Optimize: Fetch all users in one query
        Map<UUID, User> userMap = userRepository.findAllById(employeeIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // 3. Filter & Map
        return skills.stream()
                .filter(skill -> {
                    // Filter by proficiency
                    if (request.getMinProficiencyLevel() != null) {
                        return skill.getProficiencyLevel().ordinal() >= request.getMinProficiencyLevel().ordinal();
                    }
                    return true;
                })
                .filter(skill -> {
                    // Filter by Role Logic
                    User employee = userMap.get(skill.getEmployeeId());
                    if (employee == null) return false;

                    if (currentUserRole == Role.MANAGER) {
                        // Manager can only see their direct reportees
                        return currentUser.getId().equals(employee.getManagerId());
                    }
                    // HR can see all
                    return currentUserRole == Role.HR; 
                })
                .map(skill -> {
                    User employee = userMap.get(skill.getEmployeeId());
                    return SkillSearchResponse.builder()
                            .userId(employee.getId())
                            .email(employee.getEmail())
                            .skillName(skill.getSkillName())
                            .proficiencyLevel(skill.getProficiencyLevel())
                            .managerId(employee.getManagerId())
                            .build();
                })
                .sorted(Comparator.comparing(SkillSearchResponse::getProficiencyLevel).reversed()) // ADVANCED > INTERMEDIATE > BEGINNER
                .collect(Collectors.toList());
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        throw new RuntimeException("User not authenticated");
    }
}
