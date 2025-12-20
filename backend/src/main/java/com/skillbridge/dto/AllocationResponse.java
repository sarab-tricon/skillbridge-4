package com.skillbridge.dto;

import com.skillbridge.entity.ProjectAssignment;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllocationResponse {
    private String projectName;
    private String assignmentStatus;
    private String billingType;
    private String utilization;
    private UUID projectId;

    public static AllocationResponse bench() {
        return AllocationResponse.builder()
                .projectName("Bench")
                .assignmentStatus("ENDED")
                .utilization("BENCH")
                .build();
    }

    public static AllocationResponse from(ProjectAssignment assignment) {
        String billingStr = assignment.getBillingType() != null ? assignment.getBillingType().name() : "NONE";
        return AllocationResponse.builder()
                .projectId(assignment.getProjectId())
                .projectName("Active Project") // Note: Service should set the actual name
                .assignmentStatus(assignment.getAssignmentStatus().name())
                .billingType(billingStr)
                .utilization(billingStr)
                .build();
    }
}
