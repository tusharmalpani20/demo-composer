// import { default_phone_country_code } from "@repo/constants";
// import { user_common_doc } from "src/user/user.schema";
// import { z } from "zod";

// export const forget_password_phone_otp_validation_doc = z.object({
//     phone: z.string().describe("This is the phone number to which the the otp will be sent"),
//     phone_country_code: user_common_doc.user_phone_country_code_doc.describe("This is the country code of the phone number to which the the otp will be sent").nullish(),
// }).strict();

// export type Forget_Password_Phone_Otp_Validation_Type = z.infer<typeof forget_password_phone_otp_validation_doc>;
// export type TForgetPasswordPhoneOtpValidation = Forget_Password_Phone_Otp_Validation_Type;

// export const forget_password_phone_otp_validation_catch_doc = z.object({
//     phone: z.string().describe("This is the phone number to which the the otp will be sent"),
//     phone_country_code: user_common_doc.user_phone_country_code_doc.describe("This is the country code of the phone number to which the the otp will be sent").catch(default_phone_country_code),
// }).strict();

// export type Forget_Password_Phone_Otp_Validation_Catch_Type = z.infer<typeof forget_password_phone_otp_validation_catch_doc>;
// export type TForgetPasswordPhoneOtpValidationCatch = Forget_Password_Phone_Otp_Validation_Catch_Type;

// export const forget_password_phone_verify_otp_validation_doc = z.object({
//     otp_token: z.string().min(1),
//     otp_code: z.string().min(1),
// }).strict();

// export type Forget_Password_Phone_Verify_Otp_Validation_Type = z.infer<typeof forget_password_phone_verify_otp_validation_doc>;
// export type TForgetPasswordPhoneVerifyOtpValidation = Forget_Password_Phone_Verify_Otp_Validation_Type;