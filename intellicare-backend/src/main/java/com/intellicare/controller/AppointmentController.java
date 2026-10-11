package com.intellicare.controller;

import com.intellicare.dto.BookRequest;
import com.intellicare.dto.RescheduleRequest;
import com.intellicare.model.Appointment;
import com.intellicare.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<?> book(@Valid @RequestBody BookRequest req, Authentication auth) {
        try {
            Appointment appt = appointmentService.book(req, auth.getName());
            return ResponseEntity.ok(appt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public List<Appointment> myAppointments(Authentication auth) {
        return appointmentService.getByPatient(auth.getName());
    }

    @GetMapping("/queue/{doctorId}")
    public List<Appointment> queue(@PathVariable String doctorId) {
        return appointmentService.getQueue(doctorId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> byDoctor(@PathVariable String doctorId) {
        return appointmentService.getByDoctor(doctorId);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String id) {
        try {
            return ResponseEntity.ok(appointmentService.cancel(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable String id, @RequestBody RescheduleRequest req) {
        try {
            return ResponseEntity.ok(appointmentService.reschedule(id, req.getTime()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/no-show")
    public ResponseEntity<?> noShow(@PathVariable String id) {
        try {
            return ResponseEntity.ok(appointmentService.markNoShow(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/call-next/{doctorId}")
    public ResponseEntity<?> callNext(@PathVariable String doctorId) {
        appointmentService.callNext(doctorId);
        return ResponseEntity.ok(Map.of("message", "Called next patient."));
    }

    @GetMapping("/risk/{patientId}")
    public ResponseEntity<?> noShowRisk(@PathVariable String patientId) {
        double risk = appointmentService.noShowRisk(patientId);
        String label = risk >= 0.6 ? "High" : risk >= 0.35 ? "Medium" : "Low";
        return ResponseEntity.ok(Map.of("risk", risk, "label", label));
    }
}
