import { z } from "zod";
import { date_doc } from "../../common/common.schema";
import { api_200_response_doc } from "../../common/response_structure.schema";
import { organization_response_doc } from "../../organization/response/organization.response.schema";
import { organization_role_response_doc } from "../../organization/response/organization_role.response.schema";
import { user_response_doc } from "../../user/response/user.response.schema";


export const signin_response_doc = api_200_response_doc(z.object({
    user: user_response_doc,
    organization: organization_response_doc,
    organization_role: organization_role_response_doc.nullish(),
    auth_token: z.object({
        token: z.string(),
        expires_in: date_doc
    })
}));

export type TSigninResponse = z.infer<typeof signin_response_doc>;
