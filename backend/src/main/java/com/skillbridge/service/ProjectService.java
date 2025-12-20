package com.skillbridge.service;

import com.skillbridge.dto.CreateProjectRequest;
import com.skillbridge.dto.ProjectResponse;
import com.skillbridge.entity.Project;
import com.skillbridge.enums.ProjectStatus;
import com.skillbridge.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        if (projectRepository.existsByName(request.getName())) {
            throw new RuntimeException("Project name must be unique");
        }

        Project project = Project.builder()
                .name(request.getName())
                .companyName(request.getCompanyName())
                .techStack(request.getTechStack())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .employeesRequired(request.getEmployeesRequired())
                .status(request.getStatus())
                .build();

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getActiveProjects() {
        return projectRepository.findByStatus(ProjectStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .companyName(project.getCompanyName())
                .techStack(project.getTechStack())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .employeesRequired(project.getEmployeesRequired())
                .status(project.getStatus())
                .build();
    }
}
