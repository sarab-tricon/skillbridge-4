package com.skillbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllocationDetail {
    private java.util.UUID assignmentId;
    private java.util.UUID projectId;
    private String projectName;
    private Integer allocationPercent;
    private String billingType;
    private String projectRole;
    private LocalDate startDate;
    private LocalDate endDate;
}
