import { z } from "zod";
import { api_200_response_doc } from "../../common/response_structure.schema";
import { organization_response_doc } from "../../organization/response/organization.response.schema";
import { organization_role_response_doc } from "../../organization/response/organization_role.response.schema";
import { auth_session_response_doc } from "../../authentication/index.authentication.types";
import { user_response_doc } from "./user.response.schema";
import { user_asset_doc } from "../schema/user_asset.schema";

export const user_me_update_response_doc = api_200_response_doc(z.object({
    user: user_response_doc
}));

export type TUserMeUpdateResponse = z.infer<typeof user_me_update_response_doc>;

export const user_me_detail_response_doc = api_200_response_doc(z.object({
    user: user_response_doc,
    organization: organization_response_doc,
    organization_role: organization_role_response_doc,
    user_asset: user_asset_doc,
    auth_session: auth_session_response_doc,
}));

export type TUserMeDetailResponse = z.infer<typeof user_me_detail_response_doc>;

export const user_me_set_password_response_doc = api_200_response_doc(z.any().nullish());

export type TUserSetPasswordResponse = z.infer<typeof user_me_set_password_response_doc>;

export const user_me_update_password_response_doc = api_200_response_doc(z.any().nullish());

export type TUserUpdatePasswordResponse = z.infer<typeof user_me_update_password_response_doc>;
