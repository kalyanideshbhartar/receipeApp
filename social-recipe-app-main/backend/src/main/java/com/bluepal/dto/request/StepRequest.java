package com.bluepal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StepRequest {
    @NotNull(message = "Step number is required")
    private Integer stepNumber;

    @NotBlank(message = "Instruction is required")
    private String instruction;
}
