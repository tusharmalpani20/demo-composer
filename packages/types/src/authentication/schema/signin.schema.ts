import { z } from "zod";
import { user_common_doc } from "../../user/index.user.types";

export const signin_with_password_validation_doc = z.object({
    username: z.string().describe("This can be either email, phone number or username"),
    password: user_common_doc.user_password_before_hash_doc
}).strict();

export type Signin_With_Password_Validation_Type = z.infer<typeof signin_with_password_validation_doc>;
export type TSigninWithPasswordValidation = Signin_With_Password_Validation_Type;

// export const signin_with_otp_validation_doc = z.object({
//     username: z.string().describe("This can be either email, phone number or username"),
// }).strict();

// export type Signin_With_Otp_Validation_Type = z.infer<typeof signin_with_otp_validation_doc>;
// export type TSigninWithOtpValidation = Signin_With_Otp_Validation_Type;

// export const signup_verify_otp_validation_doc = z.object({
//     otp_token: z.string(),
//     otp_code: z.string(),
// }).strict();

// export type Signin_Verify_Otp_Validation_Type = z.infer<typeof signup_verify_otp_validation_doc>;
// export type TSigninVerifyOtpValidation = Signin_Verify_Otp_Validation_Type;