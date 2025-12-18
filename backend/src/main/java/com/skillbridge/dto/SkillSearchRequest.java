package com.skillbridge.dto;

import com.skillbridge.enums.ProficiencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillSearchRequest {
    private String skillName;
    private ProficiencyLevel minProficiencyLevel;
}
