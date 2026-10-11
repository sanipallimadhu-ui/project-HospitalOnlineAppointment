package com.intellicare.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String name;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 6) private String password;
    @NotBlank private String role; // "patient", "doctor", "admin"

    // Doctor-only fields (optional)
    private String dept;
    private String start;   // "09:00"
    private String end;     // "13:00"
    private Integer slotMin;
    private Integer avg;
}
