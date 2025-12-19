package com.skillbridge.service;

import com.skillbridge.dto.EmployeeUtilizationResponse;
import com.skillbridge.dto.TeamUtilizationResponse;
import com.skillbridge.dto.UtilizationSummaryResponse;
import com.skillbridge.entity.Project;
import com.skillbridge.entity.ProjectAssignment;
import com.skillbridge.entity.User;
import com.skillbridge.enums.AssignmentStatus;
import com.skillbridge.enums.BillingType;
import com.skillbridge.enums.Role;
import com.skillbridge.repository.ProjectAssignmentRepository;
import com.skillbridge.repository.ProjectRepository;
import com.skillbridge.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UtilizationService {

    private final UserRepository userRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final ProjectRepository projectRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public EmployeeUtilizationResponse getMyUtilization() {
        User user = getCurrentUser();
        return calculateUtilization(user.getId());
    }

    private EmployeeUtilizationResponse calculateUtilization(UUID userId) {
        Optional<ProjectAssignment> activeAssignment = projectAssignmentRepository
                .findByEmployeeIdAndAssignmentStatus(userId, AssignmentStatus.ACTIVE);

        if (activeAssignment.isEmpty()) {
            return EmployeeUtilizationResponse.builder()
                    .allocationStatus("BENCH")
                    .build();
        }

        ProjectAssignment assignment = activeAssignment.get();
        Project project = projectRepository.findById(assignment.getProjectId()).orElse(null);
        String projectName = project != null ? project.getName() : null;

        String status = assignment.getBillingType() == BillingType.BILLABLE ? "BILLABLE" : "INVESTMENT";

        return EmployeeUtilizationResponse.builder()
                .allocationStatus(status)
                .projectId(assignment.getProjectId())
                .projectName(projectName)
                .build();
    }

    public List<TeamUtilizationResponse> getTeamUtilization() {
        User manager = getCurrentUser();
        List<User> reports = userRepository.findByManagerId(manager.getId());

        return reports.stream()
                .map(employee -> {
                    EmployeeUtilizationResponse util = calculateUtilization(employee.getId());
                    return TeamUtilizationResponse.builder()
                            .employeeId(employee.getId())
                            .email(employee.getEmail())
                            .allocationStatus(util.getAllocationStatus())
                            .projectName(util.getProjectName())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public UtilizationSummaryResponse getSummary() {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);

        long total = employees.size();
        long billable = 0;
        long investment = 0;
        long bench = 0;

        for (User emp : employees) {
            EmployeeUtilizationResponse util = calculateUtilization(emp.getId());
            switch (util.getAllocationStatus()) {
                case "BILLABLE" -> billable++;
                case "INVESTMENT" -> investment++;
                default -> bench++;
            }
        }

        return UtilizationSummaryResponse.builder()
                .totalEmployees(total)
                .billableCount(billable)
                .investmentCount(investment)
                .benchCount(bench)
                .build();
    }
}
