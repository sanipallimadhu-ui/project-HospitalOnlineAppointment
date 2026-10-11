package com.intellicare.service;

import com.intellicare.dto.BookRequest;
import com.intellicare.model.*;
import com.intellicare.repository.AppointmentRepository;
import com.intellicare.repository.DoctorRepository;
import com.intellicare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public Appointment book(BookRequest req, String patientEmail) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found."));
        Doctor doctor = doctorRepository.findById(req.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found."));

        // Generate token like "C-001" (first letter of department + sequence number)
        long count = appointmentRepository.findByDoctorIdAndDate(doctor.getId(), req.getDate()).size();
        String token = doctor.getDept().substring(0, 1).toUpperCase()
                + "-" + String.format("%03d", count + 1);

        Priority priority = "urgent".equalsIgnoreCase(req.getPriority())
                ? Priority.URGENT : Priority.NORMAL;

        Appointment appt = Appointment.builder()
        .patientId(patient.getId())
        .patientName(patient.getName())
        .doctorId(doctor.getId())
        .date(req.getDate())
        .time(req.getTime())
        .token(token)
        .status(AppointmentStatus.WAITING)
        .priority(priority)
        .reason(req.getReason())

        // Patient information
        .age(req.getAge())
        .gender(req.getGender())
        .phone(req.getPhone())
        .email(req.getEmail())

        // Medical information
        .medicalHistory(req.getMedicalHistory())
        .allergies(req.getAllergies())
        .currentMedications(req.getCurrentMedications())

        // Emergency contact
        .emergencyContact(req.getEmergencyContact())

        .build();

return appointmentRepository.save(appt);
    }

    public List<Appointment> getByPatient(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return appointmentRepository.findByPatientId(user.getId());
    }

    public List<Appointment> getQueue(String doctorId) {
        String today = LocalDate.now().toString();
        return appointmentRepository.findByDoctorIdAndDateAndStatus(doctorId, today, AppointmentStatus.WAITING)
                .stream()
                .sorted((a, b) -> {
                    // Urgent first, then by time
                    if (a.getPriority() != b.getPriority()) {
                        return a.getPriority() == Priority.URGENT ? -1 : 1;
                    }
                    return a.getTime().compareTo(b.getTime());
                })
                .collect(Collectors.toList());
    }

    public Appointment cancel(String id) {
        Appointment appt = findById(id);
        appt.setStatus(AppointmentStatus.CANCELLED);
        return appointmentRepository.save(appt);
    }

    public Appointment reschedule(String id, String newTime) {
        Appointment appt = findById(id);
        appt.setTime(newTime);
        return appointmentRepository.save(appt);
    }

    public Appointment markNoShow(String id) {
        Appointment appt = findById(id);
        appt.setStatus(AppointmentStatus.NO_SHOW);
        return appointmentRepository.save(appt);
    }

    @Transactional
    public void callNext(String doctorId) {
        String today = LocalDate.now().toString();

        // Finish current in-consult patient
        appointmentRepository.findByDoctorIdAndDateAndStatus(doctorId, today, AppointmentStatus.IN_CONSULT)
                .forEach(a -> {
                    a.setStatus(AppointmentStatus.DONE);
                    appointmentRepository.save(a);
                });

        // Call the next waiting patient
        List<Appointment> queue = getQueue(doctorId);
        if (!queue.isEmpty()) {
            Appointment next = queue.get(0);
            next.setStatus(AppointmentStatus.IN_CONSULT);
            appointmentRepository.save(next);
        }
    }

    public List<Appointment> getAll() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getByDoctor(String doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    /** Calculate no-show risk for a patient (0.0 to 0.9) */
    public double noShowRisk(String patientId) {
        List<Appointment> past = appointmentRepository.findByPatientId(patientId).stream()
                .filter(a -> List.of(AppointmentStatus.DONE, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED)
                        .contains(a.getStatus()))
                .collect(Collectors.toList());
        long missed = past.stream().filter(a -> a.getStatus() != AppointmentStatus.DONE).count();
        return Math.min(0.9, 0.1 + (past.isEmpty() ? 0 : (0.6 * missed) / past.size()));
    }

    private Appointment findById(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));
    }
}
