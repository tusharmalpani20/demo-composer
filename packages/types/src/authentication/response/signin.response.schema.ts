import { z } from "zod";
import { date_doc } from "../../common/common.schema";
import { api_201_response_doc } from "../../common/response_structure.schema";
import { organization_role_response_doc } from "../../organization/response/organization_role.response.schema";
import { organization_response_doc } from "../../organization/response/organization.response.schema";
import { user_response_doc } from "../../user/response/user.response.schema";
import { auth_session_response_doc } from "../schema/auth_session.schema";

export const signin_with_password_response_doc = api_201_response_doc(z.object({
    user: user_response_doc,
    organization: organization_response_doc,
    organization_role: organization_role_response_doc,
    auth_session: auth_session_response_doc,
    auth_token: z.object({
        token: z.string(),
        expires_in: date_doc
    })
}));

export type TSigninWithPasswordResponse = z.infer<typeof signin_with_password_response_doc>;
