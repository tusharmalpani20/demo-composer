
import { z } from "zod";
import { boolean_preprocess_doc } from "../../common/common.schema";

export const forget_password_phone_otp_verification_query_params_schema_doc = z.object({
    is_web_request: boolean_preprocess_doc.catch(true)
});

export type Forget_Password_Phone_Otp_Verification_Query_Params_Type = z.infer<typeof forget_password_phone_otp_verification_query_params_schema_doc>;
export type TForgetPasswordPhoneOtpVerificationQueryParams = Forget_Password_Phone_Otp_Verification_Query_Params_Type;