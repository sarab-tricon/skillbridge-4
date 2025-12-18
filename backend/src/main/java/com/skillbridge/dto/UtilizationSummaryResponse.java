package com.skillbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilizationSummaryResponse {
    private long totalEmployees;
    private long billableCount;
    private long investmentCount;
    private long benchCount;
}
