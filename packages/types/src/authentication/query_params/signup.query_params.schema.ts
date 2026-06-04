import { z } from "zod";
import { boolean_preprocess_doc } from "../../common/common.schema";

export const signup_with_email_query_params_doc = z.object({
    is_web_request: boolean_preprocess_doc.catch(true)
});

export type Signup_With_Email_Query_Params_Type = z.infer<typeof signup_with_email_query_params_doc>;
export type TSignupWithEmailQueryParams = Signup_With_Email_Query_Params_Type;

export const signup_with_email_verify_otp_query_params_doc = z.object({
    is_web_request: boolean_preprocess_doc.catch(true)
});

export type Signup_With_Email_Verify_Otp_Query_Params_Type = z.infer<typeof signup_with_email_verify_otp_query_params_doc>;
export type TSignupWithEmailVerifyOtpQueryParams = Signup_With_Email_Verify_Otp_Query_Params_Type;