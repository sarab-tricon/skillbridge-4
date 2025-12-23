package com.skillbridge.service;

import com.skillbridge.dto.SkillSearchRequest;
import com.skillbridge.dto.SkillSearchResponse;
import com.skillbridge.entity.EmployeeSkill;
import com.skillbridge.entity.User;

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

        // 1. Fetch skills
        List<EmployeeSkill> skills;
        if (request.getSkillNames() != null && !request.getSkillNames().isEmpty()) {
            skills = employeeSkillRepository.findBySkillNameInIgnoreCaseAndStatus(
                    request.getSkillNames(),
                    SkillStatus.APPROVED);
        } else {
            skills = employeeSkillRepository.findBySkillNameIgnoreCaseAndStatus(
                    request.getSkillName(),
                    SkillStatus.APPROVED);
        }

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

        // 3. For multi-skill search: Group by employee and filter for employees with
        // ALL requested skills
        Map<UUID, List<EmployeeSkill>> skillsByEmployee = skills.stream()
                .collect(Collectors.groupingBy(EmployeeSkill::getEmployeeId));

        // If searching for multiple skills, filter to only employees who have ALL of
        // them
        if (request.getSkillNames() != null && request.getSkillNames().size() > 1) {
            Set<String> requestedSkillsLower = request.getSkillNames().stream()
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());

            skillsByEmployee = skillsByEmployee.entrySet().stream()
                    .filter(entry -> {
                        Set<String> employeeSkillsLower = entry.getValue().stream()
                                .map(s -> s.getSkillName().toLowerCase())
                                .collect(Collectors.toSet());
                        return employeeSkillsLower.containsAll(requestedSkillsLower);
                    })
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        }

        // 4. Filter & Map - one entry per employee with combined skills
        return skillsByEmployee.entrySet().stream()
                .filter(entry -> {
                    // Filter by role
                    User employee = userMap.get(entry.getKey());
                    if (employee == null)
                        return false;

                    if (currentUserRole == Role.MANAGER) {
                        return currentUser.getId().equals(employee.getManagerId());
                    }
                    return currentUserRole == Role.HR;
                })
                .filter(entry -> {
                    // Filter by proficiency if specified
                    if (request.getMinProficiencyLevel() != null) {
                        return entry.getValue().stream()
                                .anyMatch(skill -> skill.getProficiencyLevel().ordinal() >= request
                                        .getMinProficiencyLevel().ordinal());
                    }
                    return true;
                })
                .map(entry -> {
                    UUID employeeId = entry.getKey();
                    List<EmployeeSkill> employeeSkills = entry.getValue();
                    User employee = userMap.get(employeeId);

                    // Map individual skills to SkillResponse
                    List<com.skillbridge.dto.SkillResponse> matches = employeeSkills.stream()
                            .map(s -> com.skillbridge.dto.SkillResponse.builder()
                                    .id(s.getId())
                                    .skillName(s.getSkillName())
                                    .proficiencyLevel(s.getProficiencyLevel())
                                    .status(s.getStatus())
                                    .build())
                            .sorted(Comparator.comparing(com.skillbridge.dto.SkillResponse::getProficiencyLevel)
                                    .reversed())
                            .collect(Collectors.toList());

                    // Combine skill names (legacy support/display summary)
                    String combinedSkills = matches.stream()
                            .map(com.skillbridge.dto.SkillResponse::getSkillName)
                            .collect(Collectors.joining(", "));

                    // Get highest proficiency level (legacy support)
                    com.skillbridge.enums.ProficiencyLevel highestLevel = matches.stream()
                            .map(com.skillbridge.dto.SkillResponse::getProficiencyLevel)
                            .max(Comparator.comparingInt(Enum::ordinal))
                            .orElse(com.skillbridge.enums.ProficiencyLevel.BEGINNER);

                    // Get first status (legacy)
                    SkillStatus status = matches.isEmpty() ? SkillStatus.PENDING : matches.get(0).getStatus();

                    return SkillSearchResponse.builder()
                            .userId(employee.getId())
                            .email(employee.getEmail())
                            .employeeName(employee.getFirstName() + " " + employee.getLastName()) // Fix: Use name
                                                                                                  // instead of email
                            .skillName(combinedSkills)
                            .proficiencyLevel(highestLevel)
                            .status(status)
                            .managerId(employee.getManagerId())
                            .matches(matches)
                            .build();
                })
                .sorted(Comparator.comparing(SkillSearchResponse::getProficiencyLevel).reversed())
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
