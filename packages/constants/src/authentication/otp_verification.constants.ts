import { z } from "zod";

export const otp_verification_send_to_type_enum_doc = z.enum([
    'email',
    'phone'
]);

export const EOtpVerificationSendToType = otp_verification_send_to_type_enum_doc;

export type Otp_Verification_Send_To_Eum = z.infer<typeof otp_verification_send_to_type_enum_doc>;
export type TOtpVerificationSendTo = Otp_Verification_Send_To_Eum;

// Common OTP purposes
export const otp_verification_for_enum_doc = z.enum([
    'phone_verification',
    'email_verification',
    'authentication',
    'password_reset',
    'signin_verification',
    'signup_verification',
    'forget_password_phone_verification'
]);

export const EOtpVerificationFor = otp_verification_for_enum_doc;

export type Otp_Verification_For_Enum = z.infer<typeof otp_verification_for_enum_doc>;
export type TOtpVerificationFor = Otp_Verification_For_Enum;

// Common OTP sending providers
export const otp_verification_send_by_enum_doc = z.enum([
    'email',
    'whatsapp',
    'textlocal',
    // 'aws_sns',
    // 'firebase'
]);

export const EOtpVerificationSendBy = otp_verification_send_by_enum_doc;

export type Otp_Verification_Send_By_Enum = z.infer<typeof otp_verification_send_by_enum_doc>;
export type TOtpVerificationSendBy = Otp_Verification_Send_By_Enum;


export const otp_verification_status_enum_doc = z.enum([
    'pending',
    'verified',
    'expired'
]);

export const EOtpVerificationStatus = otp_verification_status_enum_doc;

export type Otp_Verification_Status_Enum = z.infer<typeof otp_verification_status_enum_doc>;
export type TOtpVerificationStatus = Otp_Verification_Status_Enum;