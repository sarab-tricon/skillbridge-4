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
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // 1. PUBLIC
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/**", "/h2-console/**").permitAll()

                        // 2. EMPLOYEE + MANAGER ACCESS (Specific matchers FIRST)
                        .requestMatchers("/allocations/me").hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_MANAGER")
                        .requestMatchers("/assignments/my").hasAuthority("ROLE_EMPLOYEE")
                        .requestMatchers("/utilization/me").authenticated()
                        .requestMatchers("/projects/active").hasAnyAuthority("ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE")
                        .requestMatchers("/skills/my").hasAuthority("ROLE_EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/skills").hasAuthority("ROLE_EMPLOYEE")

                        // 3. MANAGER ACCESS
                        .requestMatchers("/users/team").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/utilization/team").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/skills/pending").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/skills/*/verify").hasAuthority("ROLE_MANAGER")

                        // 4. HR-ONLY ACCESS (Broad matchers LAST)
                        .requestMatchers("/users/bench/**").hasAuthority("ROLE_HR")
                        .requestMatchers("/users/**").hasAuthority("ROLE_HR")
                        .requestMatchers("/assignments/**").hasAuthority("ROLE_HR")
                        .requestMatchers("/projects/**").hasAuthority("ROLE_HR")
                        .requestMatchers("/utilization/summary").hasAuthority("ROLE_HR")
                        .requestMatchers(HttpMethod.GET, "/skills/search").hasAnyAuthority("ROLE_MANAGER", "ROLE_HR")

                        // 5. GLOBAL FALLBACK
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
        // Allow multiple localhost ports to handle dev scenarios where port increments
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
