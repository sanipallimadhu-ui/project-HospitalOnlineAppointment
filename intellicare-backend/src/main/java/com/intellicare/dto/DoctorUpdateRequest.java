package com.intellicare.dto;

import lombok.Data;

@Data
public class DoctorUpdateRequest {
    private String dept;
    private String start;
    private String end;
    private Integer slotMin;
    private Integer avg;
}
