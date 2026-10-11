package com.intellicare.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String patientId;

    /** Patient name */
    @Column(nullable = false)
    private String patientName;

    @Column(nullable = false)
    private String doctorId;

    /** Date in YYYY-MM-DD format */
    @Column(nullable = false)
    private String date;

    /** Time in HH:mm format */
    @Column(nullable = false)
    private String time;

    /** Token like C-001 */
    @Column(nullable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    /** Reason for appointment */
    private String reason;

    // =========================
    // Patient information
    // =========================

    private String age;

    private String gender;

    private String phone;

    private String email;

    // =========================
    // Medical information
    // =========================

    @Column(length = 2000)
    private String medicalHistory;

    @Column(length = 1000)
    private String allergies;

    @Column(length = 1000)
    private String currentMedications;

    // =========================
    // Emergency contact
    // =========================

    private String emergencyContact;
}