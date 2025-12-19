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
                                                .email("hr@skillbridge.com")
                                                .password(passwordEncoder.encode("password"))
                                                .role(Role.HR)
                                                .build();
                                userRepository.save(hr);

                                // 2. Create Manager
                                User manager = User.builder()
                                                .email("manager@skillbridge.com")
                                                .password(passwordEncoder.encode("password"))
                                                .role(Role.MANAGER)
                                                .build();
                                manager = userRepository.save(manager);

                                // 3. Create Employee (linked to Manager)
                                employee = User.builder()
                                                .email("employee@skillbridge.com")
                                                .password(passwordEncoder.encode("password"))
                                                .role(Role.EMPLOYEE)
                                                .managerId(manager.getId())
                                                .build();
                                employee = userRepository.save(employee);
                        }

                        // At this point, employee definitely exists in DB
                        // Check if they have skills. If not, seed them using the ACTUAL employee ID.
                        if (skillRepository.findByEmployeeId(employee.getId()).isEmpty()) {
                                System.out.println("Seeding missing skills for employee@skillbridge.com...");

                                EmployeeSkill s1 = EmployeeSkill.builder()
                                                .employeeId(employee.getId())
                                                .skillName("Java")
                                                .proficiencyLevel(ProficiencyLevel.ADVANCED)
                                                .status(SkillStatus.APPROVED)
                                                .build();

                                EmployeeSkill s2 = EmployeeSkill.builder()
                                                .employeeId(employee.getId())
                                                .skillName("React")
                                                .proficiencyLevel(ProficiencyLevel.INTERMEDIATE)
                                                .status(SkillStatus.APPROVED)
                                                .build();

                                EmployeeSkill s3 = EmployeeSkill.builder()
                                                .employeeId(employee.getId())
                                                .skillName("Docker")
                                                .proficiencyLevel(ProficiencyLevel.BEGINNER)
                                                .status(SkillStatus.PENDING)
                                                .build();

                                skillRepository.saveAll(List.of(s1, s2, s3));
                        }

                        // Check if they have assignments. If not, seed them.
                        if (assignmentRepository.findByEmployeeId(employee.getId()).isEmpty()) {
                                System.out.println(
                                                "Seeding missing project assignment for employee@skillbridge.com...");

                                Project project = projectRepository.findByName("SkillBridge Platform")
                                                .orElseGet(() -> projectRepository.save(Project.builder()
                                                                .name("SkillBridge Platform")
                                                                .companyName("Tricon InfoTech")
                                                                .status(ProjectStatus.ACTIVE)
                                                                .startDate(LocalDate.now().minusMonths(2))
                                                                .endDate(LocalDate.now().plusMonths(6))
                                                                .techStack(List.of("Java", "Spring Boot", "React",
                                                                                "PostgreSQL"))
                                                                .build()));

                                ProjectAssignment assignment = ProjectAssignment.builder()
                                                .employeeId(employee.getId())
                                                .projectId(project.getId())
                                                .assignmentStatus(AssignmentStatus.ACTIVE)
                                                .billingType(BillingType.BILLABLE)
                                                .startDate(LocalDate.now().minusMonths(1))
                                                .build();
                                assignmentRepository.save(assignment);
                        }

                        System.out.println("Data seeding audit complete.");
                };
        }
}
