package com.skillbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeUtilizationResponse {
    private UUID employeeId;
    private Integer totalUtilization;
    private Integer availableCapacity;
    private String allocationStatus;
    private String projectName;
    private List<AllocationDetail> assignments;
}
