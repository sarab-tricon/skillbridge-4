package com.skillbridge.controller;

import com.skillbridge.dto.CreateUserRequest;
import com.skillbridge.dto.UserProfileResponse;
import com.skillbridge.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')") // Also enforced in SecurityConfig
    public ResponseEntity<List<UserProfileResponse>> getTeam() {
        return ResponseEntity.ok(userService.getTeamMembers());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<UserProfileResponse> createUser(@RequestBody @Valid CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @GetMapping("/managers")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<UserProfileResponse>> getManagers() {
        return ResponseEntity.ok(userService.getManagers());
    }
}
