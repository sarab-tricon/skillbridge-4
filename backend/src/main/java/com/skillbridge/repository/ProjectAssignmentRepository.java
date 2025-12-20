package com.skillbridge.repository;

import com.skillbridge.entity.ProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, UUID> {
    Optional<ProjectAssignment> findTopByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    List<ProjectAssignment> findByEmployeeId(UUID employeeId);
}
