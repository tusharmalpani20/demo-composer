-- 007_authentication_otp.sql
-- Created On: 19-04-2026

-- UP:

CREATE TABLE IF NOT EXISTS "auth_schema"."otp_verification" (
    id ULID PRIMARY KEY DEFAULT gen_ulid(),

    send_to VARCHAR(255) NOT NULL,
    send_to_type VARCHAR(20) NOT NULL CHECK (send_to_type IN ('email', 'phone')),

    otp_code VARCHAR(6) NOT NULL,
    otp_for VARCHAR(50) NOT NULL,
    otp_send_by VARCHAR(50) NOT NULL,

    metadata JSONB DEFAULT NULL,

    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at timestamptz DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
    expires_at timestamptz NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_verification_lookup
    ON "auth_schema"."otp_verification"(send_to, otp_for, status);

CREATE INDEX IF NOT EXISTS idx_otp_verification_ip
    ON "auth_schema"."otp_verification"(ip_address, created_at DESC)
    WHERE ip_address IS NOT NULL;

COMMENT ON TABLE "auth_schema"."otp_verification" IS 'Stores OTP verification codes and their status';

-- DOWN:

DROP INDEX IF EXISTS idx_otp_verification_lookup;
DROP INDEX IF EXISTS idx_otp_verification_ip;

DROP TABLE IF EXISTS "auth_schema"."otp_verification";
