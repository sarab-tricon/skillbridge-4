package com.skillbridge.config;

import com.skillbridge.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Employee + Manager personal endpoints
                        .requestMatchers("/api/assignments/my").hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/allocation-requests").hasAuthority("ROLE_EMPLOYEE")
                        .requestMatchers("/api/skills/my").hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/skills")
                        .hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/skills/*")
                        .hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/skills/*")
                        .hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_MANAGER")

                        // Manager/HR endpoints
                        .requestMatchers("/api/users/team").hasAnyAuthority("ROLE_MANAGER", "ROLE_HR")
                        .requestMatchers("/api/utilization/team").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/api/skills/pending").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/api/skills/*/verify").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/api/skills/search").hasAnyAuthority("ROLE_MANAGER", "ROLE_HR")
                        .requestMatchers("/api/allocation-requests/pending").hasAnyAuthority("ROLE_MANAGER", "ROLE_HR")
                        .requestMatchers("/api/allocation-requests/*/approve")
                        .hasAnyAuthority("ROLE_MANAGER", "ROLE_HR")
                        .requestMatchers("/api/allocation-requests/*/reject").hasAnyAuthority("ROLE_MANAGER", "ROLE_HR")

                        // Shared authenticated endpoints
                        .requestMatchers("/api/users/me").authenticated()
                        .requestMatchers("/api/utilization/me", "/api/allocations/me").authenticated()
                        .requestMatchers("/api/catalog/skills").authenticated()
                        .requestMatchers("/api/projects/active")
                        .hasAnyAuthority("ROLE_MANAGER", "ROLE_HR", "ROLE_EMPLOYEE")
                        .requestMatchers("/api/assignments/**").authenticated()

                        // HR-only endpoints
                        .requestMatchers(HttpMethod.PUT, "/api/assignments/*/end")
                        .hasAnyAuthority("ROLE_HR", "ROLE_MANAGER")
                        .requestMatchers("/api/users/**").hasAuthority("ROLE_HR")
                        .requestMatchers("/api/projects/**").hasAuthority("ROLE_HR")
                        .requestMatchers("/api/utilization/summary").hasAuthority("ROLE_HR")

                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
            "http://skillbridge-app.s3-website.ap-south-1.amazonaws.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration
                .setAllowedHeaders(List.of("Authorization", "Content-Type", "Origin", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
