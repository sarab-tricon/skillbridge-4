package com.skillbridge.repository;

import com.skillbridge.entity.ProjectAssignment;
import com.skillbridge.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, UUID> {
    Optional<ProjectAssignment> findByEmployeeIdAndAssignmentStatus(UUID employeeId, AssignmentStatus status);
    List<ProjectAssignment> findByEmployeeId(UUID employeeId);
}
