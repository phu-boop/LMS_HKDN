package com.lms.platform.common.security.jwt;

import com.lms.platform.common.security.CustomUserDetails;
import com.lms.platform.modules.rbac.repository.UserTenantRoleAssignmentRepository;
import com.lms.platform.modules.tenant.entity.Tenant;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access.expiration}")
    private long accessExpirationMs;

    @Value("${jwt.refresh.expiration}")
    private long refreshExpirationMs;

    private final UserTenantRoleAssignmentRepository userTenantRoleAssignmentRepository;

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(UUID idUser, String idSchool, UserDetails userDetails, Tenant tenantFirst) {
        Claims claims = Jwts.claims().setSubject(idUser.toString());
        claims.put("unique_name", userDetails.getUsername());
        //check
        claims.put("jti", UUID.randomUUID().toString());
        claims.put(
                "full_name",
                ((CustomUserDetails) userDetails).getFullName()
        );
        claims.put("tenant_id", tenantFirst != null ? tenantFirst.getId() : null);
        claims.put("school_id", idSchool);
        claims.put("subdomain", tenantFirst != null ? tenantFirst.getSubdomain() : null);

        claims.put("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", userTenantRoleAssignmentRepository.findRoleByIdUser(idUser));
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpirationMs);
        claims.put("aud", "aig-lms-clients");

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(UUID userId, UUID tenantId) {
        Claims claims = Jwts.claims().setSubject(userId.toString());
        claims.put("tenantId", tenantId!=null?tenantId.toString():null);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                 .setSigningKey(getSigningKey())
                 .build()
                 .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Long getExpiresIn(){
        return this.accessExpirationMs;
    }
}
