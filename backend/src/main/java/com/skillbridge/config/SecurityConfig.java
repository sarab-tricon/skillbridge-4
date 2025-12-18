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
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
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
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/h2-console/**").permitAll() // Whitelist auth and debugging
                        .requestMatchers("/users/me").authenticated()
                        .requestMatchers("/users/team").hasRole("MANAGER")
                        .requestMatchers("/users/**").hasRole("HR")
                        .requestMatchers(HttpMethod.POST, "/skills").hasRole("EMPLOYEE")
                        .requestMatchers("/skills/my").hasRole("EMPLOYEE")
                        .requestMatchers("/skills/pending").hasRole("MANAGER")
                        .requestMatchers("/skills/*/verify").hasRole("MANAGER")
                        .requestMatchers("/skills/search").hasAnyRole("MANAGER", "HR")
                        .requestMatchers("/projects/active").hasAnyRole("HR", "MANAGER")
                        .requestMatchers("/projects/**").hasRole("HR")
                        .requestMatchers(HttpMethod.POST, "/assignments").hasAnyRole("HR", "MANAGER")
                        .requestMatchers("/assignments/*/end").hasAnyRole("HR", "MANAGER")
                        .requestMatchers("/assignments/my").hasRole("EMPLOYEE")
                        .requestMatchers("/utilization/me", "/allocations/me").authenticated()
                        .requestMatchers("/utilization/team").hasRole("MANAGER")
                        .requestMatchers("/utilization/summary").hasRole("HR")
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
}
