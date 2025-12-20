package com.skillbridge.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeUtilizationResponse {
    private String projectName;
    private String assignmentStatus;
    private String billingType;
    private String utilization;
    private UUID projectId;
    private String allocationStatus; // Kept for backward compatibility if needed
}
