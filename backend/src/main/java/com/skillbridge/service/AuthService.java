package com.skillbridge.service;

import com.skillbridge.dto.AuthResponse;
import com.skillbridge.dto.LoginRequest;
import com.skillbridge.entity.User;
import com.skillbridge.repository.UserRepository;
import com.skillbridge.security.CustomUserDetails;
import com.skillbridge.security.JwtService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Generate new JTI
        String jti = UUID.randomUUID().toString();

        // Update user active JTI to enforce single session
        user.setActiveJti(jti);
        userRepository.save(user);

        // Generate token with this specific JTI
        String jwtToken = jwtService.generateToken(user, jti);

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole())
                .userId(user.getId())
                .build();
    }

    public AuthResponse getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            User user = userDetails.getUser();
            return AuthResponse.builder()
                    // We don't return token here, just user info
                    .token(null) // Or keep existing if needed
                    .email(user.getEmail())
                    .role(user.getRole())
                    .userId(user.getId())
                    .build();
        }
        throw new RuntimeException("No authenticated user");
    }
}
