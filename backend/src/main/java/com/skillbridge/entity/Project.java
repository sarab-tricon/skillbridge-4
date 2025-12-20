package com.skillbridge.entity;

import com.skillbridge.enums.ProjectStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Project name is required")
    @Column(nullable = false, unique = true)
    private String name;

    @NotBlank(message = "Company name is required")
    @Column(nullable = false)
    private String companyName;

    @NotEmpty(message = "Tech stack cannot be empty")
    @ElementCollection
    @CollectionTable(name = "project_tech_stack", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "tech")
    private List<String> techStack;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(nullable = false)
    private LocalDate endDate;

    @Column(name = "employees_required")
    private Integer employeesRequired;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Project status is required")
    @Column(nullable = false)
    private ProjectStatus status;
}
