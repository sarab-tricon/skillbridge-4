package com.skillbridge.dto;

import com.skillbridge.enums.BillingType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssignmentRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    @NotNull(message = "Billing type is required")
    private BillingType billingType;

    @NotNull(message = "Start date is required")
    private java.time.LocalDate startDate;

    private java.time.LocalDate endDate;
}
