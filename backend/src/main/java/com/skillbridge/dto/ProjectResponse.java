package com.skillbridge.dto;

import com.skillbridge.enums.ProjectStatus;
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
public class ProjectResponse {
    private UUID id;
    private String name;
    private String companyName;
    private List<String> techStack;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProjectStatus status;
}
