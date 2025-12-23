package com.skillbridge.service;

import com.skillbridge.dto.CreateUserRequest;
import com.skillbridge.dto.UserProfileResponse;
import com.skillbridge.dto.SkillResponse;
import com.skillbridge.entity.User;
import com.skillbridge.repository.EmployeeSkillRepository;
import com.skillbridge.repository.ProjectAssignmentRepository;
import com.skillbridge.repository.ProjectRepository;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.security.CustomUserDetails;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final ProjectRepository projectRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserProfileResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already active");
        }

        // Validation Rules:
        // EMPLOYEE must have managerId
        // MANAGER and HR must not require managerId (enforce null for consistency)
        if (request.getRole() == com.skillbridge.enums.Role.EMPLOYEE && request.getManagerId() == null) {
            throw new RuntimeException("Manager is required for Employee role");
        }

        UUID managerId = request.getRole() == com.skillbridge.enums.Role.EMPLOYEE ? request.getManagerId() : null;

        User user = User.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .managerId(managerId)
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    public List<UserProfileResponse> getAllHRs() {
        return userRepository.findByRole(com.skillbridge.enums.Role.HR).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserProfileResponse> getAllEmployees() {
        return userRepository.findByRole(com.skillbridge.enums.Role.EMPLOYEE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserProfileResponse> getManagers() {
        return userRepository.findByRole(com.skillbridge.enums.Role.MANAGER).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserProfileResponse getCurrentUserProfile() {
        User user = getAuthenticatedUser();
        return mapToResponse(user);
    }

    public List<UserProfileResponse> getTeamMembers() {
        User manager = getAuthenticatedUser();
        // Allow ONLY Manager or HR? Requirement says "GET /users/team (Manager only)"
        // Assuming getting team members FOR the logged in manager.
        return userRepository.findByManagerId(manager.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserProfileResponse> getBenchUsers() {
        // Fetch all employees
        List<User> employees = userRepository.findByRole(com.skillbridge.enums.Role.EMPLOYEE);

        // Filter those who don't have an ACTIVE assignment
        return employees.stream()
                .filter(employee -> assignmentRepository
                        .findTopByEmployeeIdOrderByStartDateDesc(employee.getId())
                        .filter(a -> a.getAssignmentStatus() == com.skillbridge.enums.AssignmentStatus.ACTIVE)
                        .isEmpty())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        if (principal instanceof String email) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
        }
        throw new RuntimeException("User not authenticated");
    }

    private UserProfileResponse mapToResponse(User user) {
        String managerName = null;
        if (user.getManagerId() != null) {
            managerName = userRepository.findById(user.getManagerId())
                    .map(m -> {
                        if (m.getFirstName() != null && m.getLastName() != null) {
                            return m.getFirstName() + " " + m.getLastName();
                        }
                        return m.getEmail(); // Fallback to email
                    })
                    .orElse("Unknown");
        }

        List<SkillResponse> skills = employeeSkillRepository.findByEmployeeId(user.getId()).stream()
                .map(skill -> SkillResponse.builder()
                        .id(skill.getId())
                        .employeeId(user.getId())
                        .employeeName(user.getFirstName() + " " + user.getLastName())
                        .employeeEmail(user.getEmail())
                        .skillName(skill.getSkillName())
                        .proficiencyLevel(skill.getProficiencyLevel())
                        .status(skill.getStatus())
                        .build())
                .collect(Collectors.toList());

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .managerId(user.getManagerId())
                .managerName(managerName)
                .skills(skills);

        assignmentRepository.findTopByEmployeeIdOrderByStartDateDesc(user.getId())
                .ifPresent(assignment -> {
                    builder.assignmentStatus(assignment.getAssignmentStatus().name());
                    builder.startDate(assignment.getStartDate());
                    builder.endDate(assignment.getEndDate());
                    builder.billingStatus(
                            assignment.getBillingType() != null ? assignment.getBillingType().name() : null);

                    if (assignment.getAssignmentStatus() == com.skillbridge.enums.AssignmentStatus.ACTIVE) {
                        projectRepository.findById(assignment.getProjectId())
                                .ifPresent(project -> {
                                    builder.projectName(project.getName());
                                    builder.companyName(project.getCompanyName());
                                });
                    }
                });

        if (builder.build().getAssignmentStatus() == null) {
            builder.assignmentStatus("NONE");
            builder.projectName("Bench");
        } else if (builder.build().getProjectName() == null) {
            builder.projectName("Bench");
        }

        return builder.build();
    }
}
