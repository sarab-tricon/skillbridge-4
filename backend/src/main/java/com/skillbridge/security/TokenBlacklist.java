package com.skillbridge.security;

public interface TokenBlacklist {
    void addToBlacklist(String jti);

    boolean isBlacklisted(String jti);
}
