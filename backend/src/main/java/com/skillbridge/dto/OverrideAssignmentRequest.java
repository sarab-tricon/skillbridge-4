package com.skillbridge.dto;

import com.skillbridge.enums.AssignmentStatus;
import com.skillbridge.enums.BillingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverrideAssignmentRequest {
    private UUID projectId;
    private BillingType billingType;
    private AssignmentStatus assignmentStatus;
}
