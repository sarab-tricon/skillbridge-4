package com.skillbridge.dto;

import com.skillbridge.enums.ProficiencyLevel;
import com.skillbridge.enums.SkillStatus;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillSearchResponse {
    private UUID userId;
    private String email;
    private String employeeName;
    private String skillName;
    private ProficiencyLevel proficiencyLevel;
    private SkillStatus status;
    private UUID managerId;
}
