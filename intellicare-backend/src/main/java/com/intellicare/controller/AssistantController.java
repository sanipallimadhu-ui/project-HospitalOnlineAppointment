package com.intellicare.controller;

import com.intellicare.dto.ClassifyRequest;
import com.intellicare.dto.ClassifyResponse;
import com.intellicare.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/classify")
    public ResponseEntity<ClassifyResponse> classify(@RequestBody ClassifyRequest req) {
        return ResponseEntity.ok(assistantService.classify(req.getText()));
    }
}
