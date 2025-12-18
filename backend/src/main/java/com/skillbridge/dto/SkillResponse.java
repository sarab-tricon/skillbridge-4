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
public class SkillResponse {
    private UUID id;
    private String skillName;
    private ProficiencyLevel proficiencyLevel;
    private SkillStatus status;
}
