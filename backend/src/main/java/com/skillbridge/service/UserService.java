package com.skillbridge.service;

import com.skillbridge.dto.CreateUserRequest;
import com.skillbridge.dto.UserProfileResponse;
import com.skillbridge.entity.User;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.security.CustomUserDetails;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UUID createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already active");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .managerId(request.getManagerId())
                .build();

        return userRepository.save(user).getId();
    }

    public UserProfileResponse getCurrentUserProfile() {
        User user = getAuthenticatedUser();
        return mapToResponse(user);
    }

    public List<UserProfileResponse> getTeamMembers() {
        User manager = getAuthenticatedUser();
        // Allow ONLY Manager or HR? Requirement says "GET /users/team (Manager only)"
        // Assuming getting team members FOR the logged in manager.
        return userRepository.findByManagerId(manager.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        // Fallback or re-fetch if needed (though CustomUserDetails should be there)
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .managerId(user.getManagerId())
                .build();
    }
}
