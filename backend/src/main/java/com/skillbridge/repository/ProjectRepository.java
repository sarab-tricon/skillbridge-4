package com.skillbridge.repository;

import com.skillbridge.entity.Project;
import com.skillbridge.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByStatus(ProjectStatus status);

    boolean existsByName(String name);

    Optional<Project> findByName(String name);
}
