package com.skillbridge.entity;

import com.skillbridge.enums.AssignmentStatus;
import com.skillbridge.enums.BillingType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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
@Entity
@Table(name = "project_assignments")
public class ProjectAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Employee ID is required")
    @Column(nullable = false)
    private UUID employeeId;

    @NotNull(message = "Project ID is required")
    @Column(nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Assignment status is required")
    @Column(nullable = false)
    private AssignmentStatus assignmentStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private BillingType billingType;

    @Column(name = "project_role")
    private String projectRole;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(name = "allocation_percent")
    private Integer allocationPercent; // Percentage of employee time allocated (1-100)

    @Column(name = "requested_at")
    private java.time.LocalDateTime requestedAt;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Version
    private Long version;
}
