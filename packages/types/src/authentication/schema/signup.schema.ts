import {
    z
} from "zod";
import { user_common_doc } from "../../user/index.user.types";

export const signup_with_email_validation_doc = z.object({
    first_name: user_common_doc.user_first_name_doc,
    last_name: user_common_doc.user_last_name_doc,
    email: user_common_doc.user_email_doc,
}).strict();

export type Signup_With_Email_Validation_Type = z.infer<typeof signup_with_email_validation_doc>;
export type TSignupWithEmailValidation = Signup_With_Email_Validation_Type;

export const signup_with_email_verify_otp_validation_doc = z.object({
    otp_token: z.string(),
    otp_code: z.string(),
}).strict();

export type Signup_With_Email_Verify_Otp_Validation_Type = z.infer<typeof signup_with_email_verify_otp_validation_doc>;
export type TSignupWithEmailVerifyOtpValidation = Signup_With_Email_Verify_Otp_Validation_Type;

// export const signup_with_invitation_validation_doc = z.object({
//     first_name: user_common_doc.user_first_name_doc,
//     last_name: user_common_doc.user_last_name_doc,
//     invitation_id: ulid_doc
// }).strict();

// export type Signup_With_Invitation_Validation_Type = z.infer<typeof signup_with_invitation_validation_doc>;
// export type TSignupWithInvitationValidation = Signup_With_Invitation_Validation_Type;

// export const signup_with_invitation_verify_otp_validation_doc = z.object({
//     otp_token: z.string(),
//     otp_code: z.string(),
// }).strict();

// export type Signup_With_Invitation_Verify_Otp_Validation_Type = z.infer<typeof signup_with_invitation_verify_otp_validation_doc>;
// export type TSignupWithInvitationVerifyOtpValidation = Signup_With_Invitation_Verify_Otp_Validation_Type;