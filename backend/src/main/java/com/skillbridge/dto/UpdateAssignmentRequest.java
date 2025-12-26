package com.skillbridge.dto;

import com.skillbridge.enums.BillingType;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateAssignmentRequest {
    private Integer allocationPercent;
    private BillingType billingType;
    private String projectRole;
    private LocalDate startDate;
    private LocalDate endDate;
}
