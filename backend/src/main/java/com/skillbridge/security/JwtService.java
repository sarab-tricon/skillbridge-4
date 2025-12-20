package com.skillbridge.security;

import com.skillbridge.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public java.util.List<String> extractAuthorities(String token) {
        return extractClaim(token, claims -> (java.util.List<String>) claims.get("authorities"));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("role", user.getRole());
        extraClaims.put("authorities", java.util.List.of("ROLE_" + user.getRole().name()));
        // JTI is generated automatically by UUID here to ensure structure,
        // but for single session enforcement we will pass the jti explicitly or
        // generate it here.
        // We need to return JTI to caller or use the one from User.activeJti?
        // Let's assume we generate a NEW JTI here and the caller (Service) uses it to
        // update the user.
        // Wait, the requirement says "Save the JTI in User.activeJti".
        // A cleaner approach: Service generates JTI, updates user, then passes JTI to
        // generateToken.
        // OR: generateToken generates it, puts in token, and we extract it?
        // Let's rely on the service to handle the JTI logic coordination.
        // Actually, to keep JwtService pure, let's allow passing JTI or generating it.
        // I will overload generateToken to accept JTI.
        return generateToken(extraClaims, user, UUID.randomUUID().toString());
    }

    public String generateToken(User user, String jti) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("role", user.getRole());
        extraClaims.put("authorities", java.util.List.of("ROLE_" + user.getRole().name()));
        return generateToken(extraClaims, user, jti);
    }

    public String generateToken(Map<String, Object> extraClaims, User user, String jti) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(user.getEmail())
                .id(jti)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
