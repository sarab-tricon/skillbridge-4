package com.skillbridge.dto;

import com.skillbridge.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotEmpty(message = "Tech stack cannot be empty")
    private List<String> techStack;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @jakarta.validation.constraints.Min(value = 1, message = "At least 1 employee is required")
    private Integer employeesRequired;

    @NotNull(message = "Project status is required")
    private ProjectStatus status;
}
