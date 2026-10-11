package com.intellicare.repository;

import com.intellicare.model.Appointment;
import com.intellicare.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByDoctorIdAndDate(String doctorId, String date);
    List<Appointment> findByDoctorIdAndDateAndStatus(String doctorId, String date, AppointmentStatus status);
    void deleteByDoctorId(String doctorId);
}
