package com.intellicare.service;

import com.intellicare.dto.AuthResponse;
import com.intellicare.dto.LoginRequest;
import com.intellicare.dto.RegisterRequest;
import com.intellicare.model.Doctor;
import com.intellicare.model.Role;
import com.intellicare.model.User;
import com.intellicare.repository.DoctorRepository;
import com.intellicare.repository.UserRepository;
import com.intellicare.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        Role role = Role.valueOf(req.getRole().toUpperCase());
        String doctorId = null;

        // If registering as a doctor, create the doctor profile first
        if (role == Role.DOCTOR) {
            Doctor doctor = Doctor.builder()
                    .name(req.getName().trim())
                    .dept(req.getDept() != null ? req.getDept().trim() : "General")
                    .startTime(req.getStart() != null ? req.getStart() : "09:00")
                    .endTime(req.getEnd() != null ? req.getEnd() : "13:00")
                    .slotMin(req.getSlotMin() != null ? req.getSlotMin() : 15)
                    .avgVisitMin(req.getAvg() != null ? req.getAvg() : 10)
                    .build();
            doctor = doctorRepository.save(doctor);
            doctorId = doctor.getId();
        }

        User user = User.builder()
                .name(req.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .doctorId(doctorId)
                .build();
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(email, role.name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(role.name().toLowerCase())
                .doctorId(doctorId)
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found for this email."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password.");
        }

        String token = jwtUtil.generateToken(email, user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .doctorId(user.getDoctorId())
                .build();
    }
}
