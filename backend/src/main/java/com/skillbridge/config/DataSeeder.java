package com.skillbridge.config;

import com.skillbridge.entity.*;
import com.skillbridge.enums.*;
import com.skillbridge.repository.EmployeeSkillRepository;
import com.skillbridge.repository.ProjectAssignmentRepository;
import com.skillbridge.repository.ProjectRepository;
import com.skillbridge.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

        private final UserRepository userRepository;
        private final ProjectRepository projectRepository;
        private final ProjectAssignmentRepository assignmentRepository;
        private final EmployeeSkillRepository skillRepository;
        private final PasswordEncoder passwordEncoder;

        @Bean
        public CommandLineRunner seedData() {
                return args -> {
                        User employee = userRepository.findByEmail("employee@skillbridge.com").orElse(null);

                        if (employee == null) {
                                System.out.println("Seeding database with test users...");

                                // 1. Create HR
                                User hr = User.builder()
                                                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                                                .email("hr@skillbridge.com")
                                                .password(passwordEncoder.encode("password"))
                                                .role(Role.HR)
                                                .build();
                                userRepository.save(hr);

                                // 2. Create Manager
                                User manager = User.builder()
                                                .id(UUID.fromString("22222222-2222-2222-2222-222222222222"))
                                                .email("manager@skillbridge.com")
                                                .password(passwordEncoder.encode("password"))
                                                .role(Role.MANAGER)
                                                .build();
                                manager = userRepository.save(manager);

                                // 3. Create Employee
                                employee = User.builder()
                                                .id(UUID.fromString("33333333-3333-3333-3333-333333333333"))
                                                .email("employee@skillbridge.com")
                                                .password(passwordEncoder.encode("password"))
                                                .role(Role.EMPLOYEE)
                                                .managerId(manager.getId())
                                                .build();
                                employee = userRepository.save(employee);
                        }

                        // Seed skills if missing
                        if (skillRepository.findByEmployeeId(employee.getId()).isEmpty()) {
                                System.out.println("Seeding missing skills for employee@skillbridge.com...");
                                skillRepository.saveAll(List.of(
                                                EmployeeSkill.builder()
                                                                .employeeId(employee.getId())
                                                                .skillName("Java")
                                                                .proficiencyLevel(ProficiencyLevel.ADVANCED)
                                                                .status(SkillStatus.APPROVED)
                                                                .build(),
                                                EmployeeSkill.builder()
                                                                .employeeId(employee.getId())
                                                                .skillName("React")
                                                                .proficiencyLevel(ProficiencyLevel.INTERMEDIATE)
                                                                .status(SkillStatus.APPROVED)
                                                                .build()));
                        }

                        // Seed project and assignment if missing
                        if (assignmentRepository.findByEmployeeId(employee.getId()).isEmpty()) {
                                Project project = projectRepository.findByName("SkillBridge Platform").orElse(null);
                                if (project == null) {
                                        project = Project.builder()
                                                        .id(UUID.fromString("44444444-4444-4444-4444-444444444444"))
                                                        .name("SkillBridge Platform")
                                                        .companyName("Tricon InfoTech")
                                                        .status(ProjectStatus.ACTIVE)
                                                        .startDate(LocalDate.now().minusMonths(1))
                                                        .endDate(LocalDate.now().plusMonths(6))
                                                        .techStack(List.of("Java", "Spring Boot", "React",
                                                                        "PostgreSQL"))
                                                        .build();
                                        project = projectRepository.save(project);
                                }

                                ProjectAssignment assignment = ProjectAssignment.builder()
                                                .employeeId(employee.getId())
                                                .projectId(project.getId())
                                                .assignmentStatus(AssignmentStatus.ACTIVE)
                                                .billingType(BillingType.BILLABLE)
                                                .startDate(LocalDate.now().minusMonths(1))
                                                .build();
                                assignmentRepository.save(assignment);
                                System.out.println("Project assignment seeded for employee@skillbridge.com");
                        }

                        System.out.println("Data seeding audit complete.");
                };
        }
}
