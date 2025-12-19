package com.skillbridge.config;

import com.skillbridge.entity.User;
import com.skillbridge.enums.Role;
import com.skillbridge.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedUsers() {
        return args -> {
            if (userRepository.count() == 0) {
                System.out.println("Seeding database with test users...");

                // Create HR
                User hr = User.builder()
                        .email("hr@skillbridge.com")
                        .password(passwordEncoder.encode("password"))
                        .role(Role.HR)
                        .build();
                userRepository.save(hr);

                // Create Manager
                User manager = User.builder()
                        .email("manager@skillbridge.com")
                        .password(passwordEncoder.encode("password"))
                        .role(Role.MANAGER)
                        .build();
                manager = userRepository.save(manager);

                // Create Employee (linked to Manager)
                User employee = User.builder()
                        .email("employee@skillbridge.com")
                        .password(passwordEncoder.encode("password"))
                        .role(Role.EMPLOYEE)
                        .managerId(manager.getId())
                        .build();
                userRepository.save(employee);

                System.out.println("Seeding complete: HR, Manager, and Employee created.");
            }
        };
    }
}
