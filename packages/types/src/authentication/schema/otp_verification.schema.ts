import {
    otp_verification_for_enum_doc,
    otp_verification_send_by_enum_doc,
    otp_verification_send_to_type_enum_doc,
    otp_verification_status_enum_doc,
} from "@repo/constants";

import { z } from "zod";
import {
    date_doc,
    positive_int_doc,
    ulid_doc,
    version_doc
} from "../../common/index.common.schema";

export const otp_verification_doc = z.object({
    id: ulid_doc,

    send_to: z.string().min(1).max(255),
    send_to_type: otp_verification_send_to_type_enum_doc,

    otp_code: z.string().length(6),
    otp_for: otp_verification_for_enum_doc,
    otp_send_by: otp_verification_send_by_enum_doc,

    metadata: z.record(z.string(), z.unknown()).nullable(),

    attempt_count: positive_int_doc.min(0),
    last_attempt_at: date_doc.nullable(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),

    expires_at: date_doc,
    status: otp_verification_status_enum_doc,
    version: version_doc,
    created_at: date_doc,
    updated_at: date_doc,
});

export type OTP_Verification_Type = z.infer<typeof otp_verification_doc>;
export type TOTPVerification = OTP_Verification_Type;

export const otp_verification_create_doc = otp_verification_doc.pick({
    id: true,

    send_to: true,
    send_to_type: true,

    otp_code: true,
    otp_for: true,
    otp_send_by: true,

    metadata: true,

    ip_address: true,
    user_agent: true,

    expires_at: true,

    created_at: true,
    updated_at: true
});

export type OTP_Verification_Create_Type = z.infer<typeof otp_verification_create_doc>;
export type TOTPVerificationCreate = OTP_Verification_Create_Type;

export const otp_verification_create_validation_doc = otp_verification_create_doc.pick({
    send_to: true,
});

export type OTP_Verification_Create_Validation_Type = z.infer<typeof otp_verification_create_validation_doc>;
export type TOTPVerificationCreateValidation = OTP_Verification_Create_Validation_Type;

export const otp_verification_update_doc = otp_verification_doc.pick({
    id: true,
    status: true,
    updated_at: true
});

export type OTP_Verification_Update_Type = z.infer<typeof otp_verification_update_doc>;
export type TOTPVerificationUpdate = OTP_Verification_Update_Type;

export const otp_verification_client_doc = otp_verification_doc.pick({
    send_to: true,
    // send_to_type: true,
    otp_code: true,
    // otp_for: true,
    // otp_send_by: true,
});

export type OTP_Verification_Client_Type = z.infer<typeof otp_verification_client_doc>;
export type TOTPVerificationClient = OTP_Verification_Client_Type;
