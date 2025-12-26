package com.skillbridge.dto;

import com.skillbridge.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectStatusRequest {

    @NotNull(message = "Status is required")
    private ProjectStatus status;
}
