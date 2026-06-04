
import { z } from "zod";
import { boolean_preprocess_doc } from "../../common/common.schema";

export const signin_query_params_doc = z.object({
    is_web_request: boolean_preprocess_doc.catch(true)
});

export type Signin_Query_Params_Type = z.infer<typeof signin_query_params_doc>;
export type TSigninQueryParams = Signin_Query_Params_Type;

export const signin_otp_verification_query_params_schema_doc = z.object({
    is_web_request: boolean_preprocess_doc.catch(true)
});

export type Signin_Otp_Verification_Query_Params_Type = z.infer<typeof signin_otp_verification_query_params_schema_doc>;
export type TSigninOtpVerificationQueryParams = Signin_Otp_Verification_Query_Params_Type;