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
import java.util.UUID;
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

    @Transactional
    public ProjectResponse updateProject(UUID id, CreateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        // Check for uniqueness if name changed
        if (!project.getName().equalsIgnoreCase(request.getName())) {
            if (projectRepository.existsByName(request.getName())) {
                throw new RuntimeException("Project name must be unique");
            }
        }

        project.setName(request.getName());
        project.setCompanyName(request.getCompanyName());
        project.setTechStack(request.getTechStack());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus());

        return mapToResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .companyName(project.getCompanyName())
                .techStack(project.getTechStack())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .build();
    }
}
