package com.skillbridge.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    // We need to check activeJti. The CustomUserDetails contains the user entity
    // state AT THE TIME OF LOADING.
    // If we load UserDetails here, it fetches fresh from DB.
    // So CustomUserDetails.getUser().getActiveJti() will be the current one in DB.

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Load fresh user details from DB
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                // Validate generic token validity (signature, expiration)
                if (jwtService.isTokenValid(jwt, userDetails)) {

                    // STRICT JTI ENFORCEMENT
                    String tokenJti = jwtService.extractJti(jwt);
                    if (userDetails instanceof CustomUserDetails customUserDetails) {
                        String dbJti = customUserDetails.getUser().getActiveJti();

                        if (dbJti == null || !dbJti.equals(tokenJti)) {
                            // JTI mismatch implies this token is from an old session
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                                    "Session expired or invalid (JTI Mismatch)");
                            return;
                        }
                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // In case of JWT parsing errors or other issues, we just continue.
            // The SecurityContext will remain empty, failing later stages if they need
            // auth.
            // But if we want to return specific error for 401, we might handle it here.
            // For now, let Spring Security handle 401 if context is empty.
        }

        filterChain.doFilter(request, response);
    }
}
