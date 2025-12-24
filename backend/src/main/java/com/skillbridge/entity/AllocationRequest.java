package com.skillbridge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "allocation_requests")
public class AllocationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    // New Fields for Workflow
    @Column(name = "manager_comments")
    private String managerComments;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "forwarded_at")
    private LocalDateTime forwardedAt;

    @Column(name = "forwarded_by")
    private UUID forwardedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type")
    private com.skillbridge.enums.BillingType billingType;
}
