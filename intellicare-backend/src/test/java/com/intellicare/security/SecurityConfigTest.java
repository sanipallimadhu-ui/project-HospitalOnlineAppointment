package com.intellicare.security;

import com.intellicare.controller.AdminController;
import com.intellicare.controller.AuthController;
import com.intellicare.controller.DoctorController;
import com.intellicare.controller.RootController;
import com.intellicare.repository.AppointmentRepository;
import com.intellicare.repository.DoctorRepository;
import com.intellicare.repository.UserRepository;
import com.intellicare.service.AppointmentService;
import com.intellicare.service.AuthService;
import com.intellicare.service.DoctorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        RootController.class,
        AuthController.class,
        AdminController.class,
        DoctorController.class
})
@Import({SecurityConfig.class, JwtAuthFilter.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private DoctorService doctorService;

    @MockitoBean
    private AppointmentService appointmentService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private DoctorRepository doctorRepository;

    @MockitoBean
    private AppointmentRepository appointmentRepository;

    @Test
    @DisplayName("GET / should be public and return 200 OK")
    void testRootEndpointPublic() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("GET /error should be public and not return 403 Forbidden")
    void testErrorEndpointPublic() throws Exception {
        // Without an error attribute, it will return error or 200/404, but NOT 403
        mockMvc.perform(get("/error"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertNotEquals(403, s,
                            "GET /error must not return 403 Forbidden");
                });
    }

    @Test
    @DisplayName("POST /api/auth/login should be public")
    void testAuthLoginPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@test.com\",\"password\":\"123456\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/admin/stats without authentication should return 403 Forbidden")
    void testAdminUnauthenticatedReturns403() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/stats with PATIENT role should return 403 Forbidden")
    @WithMockUser(username = "patient@test.com", roles = {"PATIENT"})
    void testAdminWithPatientRoleReturns403() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/stats with ADMIN role should return 200 OK")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void testAdminWithAdminRoleReturns200() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/doctors without authentication should return 403 Forbidden")
    void testDoctorsUnauthenticatedReturns403() throws Exception {
        mockMvc.perform(get("/api/doctors"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/doctors with authenticated user should return 200 OK")
    @WithMockUser(username = "user@test.com", roles = {"PATIENT"})
    void testDoctorsAuthenticatedReturns200() throws Exception {
        mockMvc.perform(get("/api/doctors"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("CORS preflight from allowed origin should succeed")
    void testCorsPreflightAllowedOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    @DisplayName("CORS preflight from disallowed origin should return 403 Forbidden")
    void testCorsPreflightDisallowedOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://malicious-site.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
}

