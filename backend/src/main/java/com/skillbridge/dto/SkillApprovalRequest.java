package com.skillbridge.dto;

import com.skillbridge.enums.SkillStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillApprovalRequest {
    @NotNull(message = "Status is required")
    private SkillStatus status;
}
