package com.intellicare.service;

import com.intellicare.dto.ClassifyResponse;
import com.intellicare.model.Doctor;
import com.intellicare.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private final DoctorRepository doctorRepository;

    private static final List<String> URGENT_KEYWORDS = List.of(
            "chest pain", "breathing", "unconscious", "bleeding", "stroke", "seizure", "faint"
    );

    private static final List<Map.Entry<Pattern, String>> DEPT_PATTERNS = List.of(
            Map.entry(Pattern.compile("child|baby|vaccin|infant", Pattern.CASE_INSENSITIVE), "pediatric"),
            Map.entry(Pattern.compile("heart|chest|palpitation|ecg|blood pressure", Pattern.CASE_INSENSITIVE), "cardio"),
            Map.entry(Pattern.compile("skin|rash|acne", Pattern.CASE_INSENSITIVE), "derma"),
            Map.entry(Pattern.compile("bone|joint|fracture|knee", Pattern.CASE_INSENSITIVE), "ortho")
    );

    public ClassifyResponse classify(String text) {
        String lower = text.toLowerCase();
        boolean urgent = URGENT_KEYWORDS.stream().anyMatch(lower::contains);

        String deptKey = "general";
        for (var entry : DEPT_PATTERNS) {
            if (entry.getKey().matcher(lower).find()) {
                deptKey = entry.getValue();
                break;
            }
        }

        List<Doctor> doctors = doctorRepository.findAll();
        final String key = deptKey;
        Doctor match = doctors.stream()
                .filter(d -> d.getDept().toLowerCase().contains(key))
                .findFirst()
                .orElse(null);

        String message = urgent
                ? "This may need quick attention. Please go to the emergency desk or call the hospital now. Your request has been marked urgent."
                : "This looks like a routine visit. Pick a time to book.";

        ClassifyResponse.DoctorInfo doctorInfo = null;
        if (match != null) {
            doctorInfo = ClassifyResponse.DoctorInfo.builder()
                    .id(match.getId())
                    .name(match.getName())
                    .dept(match.getDept())
                    .build();
        }

        return ClassifyResponse.builder()
                .urgency(urgent ? "urgent" : "normal")
                .doctor(doctorInfo)
                .message(message)
                .build();
    }
}
