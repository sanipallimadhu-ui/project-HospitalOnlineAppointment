package com.intellicare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClassifyResponse {
    private String urgency;  // "urgent" or "normal"
    private DoctorInfo doctor;
    private String message;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DoctorInfo {
        private String id;
        private String name;
        private String dept;
    }
}
