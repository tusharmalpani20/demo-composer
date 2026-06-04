// import { organization_user_response_doc } from "src/organization/index.organization.schema";
// import { z } from "zod";
// import { date_doc } from "../../common/common.schema";
// import { api_201_response_doc } from "../../common/response_structure.schema";
// import { organization_response_doc } from "../../organization/response/organization.response.schema";
// import { user_response_doc } from "../../user/response/user.response.schema";
// import { auth_session_response_doc } from "../schema/auth_session.schema";


// export const forget_password_phone_otp_response_doc = api_201_response_doc(z.object({
//     otp_token: z.string(),
//     phone: z.string(),
//     phone_country_code: z.string()
// }));

// export type TForgetPasswordPhoneOtpResponse = z.infer<typeof forget_password_phone_otp_response_doc>;

// export const forget_password_phone_otp_verify_response_doc = api_201_response_doc(z.object({
//     user: user_response_doc,
//     organization_list: z.array(organization_response_doc.extend({
//         organization_user: organization_user_response_doc
//     })),
//     auth_session: auth_session_response_doc,
//     auth_token: z.object({
//         token: z.string(),
//         expires_in: date_doc
//     })
// }));

// export type TForgetPasswordPhoneOtpVerifyResponse = z.infer<typeof forget_password_phone_otp_verify_response_doc>;