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
    private String allocationStatus; // BILLABLE, INVESTMENT, BENCH
    private UUID projectId;
    private String projectName;
}
