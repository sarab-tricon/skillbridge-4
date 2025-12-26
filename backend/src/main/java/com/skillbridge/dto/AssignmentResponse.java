package com.skillbridge.dto;

import com.skillbridge.enums.AssignmentStatus;
import com.skillbridge.enums.BillingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {
    private UUID assignmentId;
    private UUID employeeId;
    private UUID projectId;
    private String projectName;
    private BillingType billingType;
    private AssignmentStatus assignmentStatus;
    private String utilization; // Changed to String as per user request
    private LocalDate startDate;
    private LocalDate endDate;
    private java.time.LocalDateTime requestedAt;
    private String employeeName;
    private String managerName; // New field for HR visibility
    private String requestStatus; // e.g. PENDING_MANAGER, PENDING_HR, REJECTED, APPROVED
    private String projectRole;
}
