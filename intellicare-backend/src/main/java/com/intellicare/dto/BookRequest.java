package com.intellicare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookRequest {

    @NotBlank
    private String doctorId;

    @NotBlank
    private String date;

    @NotBlank
    private String time;

    private String reason;
    private String priority;

    // Patient details
    private String age;
    private String gender;
    private String phone;
    private String email;

    // Medical information
    private String medicalHistory;
    private String allergies;
    private String currentMedications;

    // Emergency contact
    private String emergencyContact;
}