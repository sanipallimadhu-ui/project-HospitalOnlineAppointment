package com.intellicare.controller;

import com.intellicare.dto.RegisterRequest;
import com.intellicare.model.AppointmentStatus;
import com.intellicare.model.Role;
import com.intellicare.repository.AppointmentRepository;
import com.intellicare.repository.DoctorRepository;
import com.intellicare.repository.UserRepository;
import com.intellicare.service.AppointmentService;
import com.intellicare.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final AuthService authService;

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        String today = LocalDate.now().toString();
        var allAppts = appointmentRepository.findAll();
        long doctorCount = doctorRepository.count();
        long patientCount = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.PATIENT).count();
        long waitingToday = allAppts.stream()
                .filter(a -> a.getDate().equals(today) && a.getStatus() == AppointmentStatus.WAITING).count();
        long urgentInQueue = allAppts.stream()
                .filter(a -> a.getDate().equals(today) && a.getStatus() == AppointmentStatus.WAITING
                        && a.getPriority() == com.intellicare.model.Priority.URGENT).count();

        return ResponseEntity.ok(Map.of(
                "doctors", doctorCount,
                "patients", patientCount,
                "waitingToday", waitingToday,
                "urgentInQueue", urgentInQueue
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> users() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/doctors")
    public ResponseEntity<?> addDoctor(@RequestBody RegisterRequest req) {
        try {
            req.setRole("doctor");
            // register creates both a user account and a doctor profile
            var res = authService.register(req);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> allAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }
}
