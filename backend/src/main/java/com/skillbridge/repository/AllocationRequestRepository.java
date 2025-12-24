package com.skillbridge.repository;

import com.skillbridge.entity.AllocationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AllocationRequestRepository extends JpaRepository<AllocationRequest, UUID> {
    List<AllocationRequest> findByStatus(String status);

    List<AllocationRequest> findByEmployeeId(UUID employeeId);

    boolean existsByEmployeeIdAndStatusIn(UUID employeeId, List<String> statuses);
}
