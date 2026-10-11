package com.intellicare.service;

import com.intellicare.dto.DoctorUpdateRequest;
import com.intellicare.model.Doctor;
import com.intellicare.repository.AppointmentRepository;
import com.intellicare.repository.DoctorRepository;
import com.intellicare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    public List<Doctor> getAll() {
        return doctorRepository.findAll();
    }

    public Doctor getById(String id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found."));
    }

    public Doctor update(String id, DoctorUpdateRequest req) {
        Doctor doctor = getById(id);
        if (req.getDept() != null) doctor.setDept(req.getDept());
        if (req.getStart() != null) doctor.setStartTime(req.getStart());
        if (req.getEnd() != null) doctor.setEndTime(req.getEnd());
        if (req.getSlotMin() != null) doctor.setSlotMin(req.getSlotMin());
        if (req.getAvg() != null) doctor.setAvgVisitMin(req.getAvg());
        return doctorRepository.save(doctor);
    }

    @Transactional
    public void delete(String id) {
        // Remove all appointments for this doctor
        appointmentRepository.deleteByDoctorId(id);
        // Remove the user account linked to this doctor
        userRepository.findAll().stream()
                .filter(u -> id.equals(u.getDoctorId()))
                .forEach(u -> userRepository.delete(u));
        // Remove the doctor
        doctorRepository.deleteById(id);
    }
}
