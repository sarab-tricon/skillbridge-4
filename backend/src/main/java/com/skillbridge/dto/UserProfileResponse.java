package com.skillbridge.dto;

import com.skillbridge.enums.Role;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private UUID managerId;
    private String managerName;
    private String projectName;
    private String companyName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String billingStatus;
    private String assignmentStatus;
    private List<SkillResponse> skills;
}
