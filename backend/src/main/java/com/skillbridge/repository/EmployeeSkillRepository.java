package com.skillbridge.repository;

import com.skillbridge.entity.EmployeeSkill;
import com.skillbridge.enums.SkillStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, UUID> {
    List<EmployeeSkill> findByEmployeeId(UUID employeeId);

    List<EmployeeSkill> findByStatusAndEmployeeIdIn(SkillStatus status, List<UUID> employeeIds);

    List<EmployeeSkill> findBySkillNameIgnoreCaseAndStatus(String skillName, SkillStatus status);
}
