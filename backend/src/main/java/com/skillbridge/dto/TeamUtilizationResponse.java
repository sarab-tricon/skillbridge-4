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
public class TeamUtilizationResponse {
    private UUID employeeId;
    private String email;
    private String allocationStatus;
    private String projectName;
}
