package com.intellicare.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    /** Department, e.g. "Cardiology", "Pediatrics" */
    @Column(nullable = false)
    private String dept;

    /** Work start time, e.g. "09:00" */
    @Column(name = "start_time", nullable = false)
    private String startTime;

    /** Work end time, e.g. "13:00" */
    @Column(name = "end_time", nullable = false)
    private String endTime;

    /** Slot duration in minutes */
    @Column(nullable = false)
    private int slotMin;

    /** Average visit duration in minutes */
    @Column(name = "avg_visit_min", nullable = false)
    private int avgVisitMin;
}
