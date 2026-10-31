
package com.pitchbid.security.dto;

public record AuthResponse(
    Long id,
    String name,
    String email,
    String token
) {
}
