import { user_identity_provider_enum_doc } from "@repo/constants";
import { z } from "zod";
import { boolean_doc, date_doc, ulid_doc } from "../../common/common.schema";

export const auth_session_doc = z.object({
    id: ulid_doc,
    user_id: ulid_doc,
    organization_id: ulid_doc,
    identity_provider: user_identity_provider_enum_doc,
    identity_provider_session_id: z.string().nullish(),
    jwt_token: z.string(),
    ip_address: z.string().nullish(),
    user_agent: z.string().nullish(),
    expires_at: date_doc,
    is_session_active: boolean_doc,
    last_active_at: date_doc,
    created_at: date_doc,
    updated_at: date_doc,
});

export type Auth_Session_Type = z.infer<typeof auth_session_doc>;
export type TAuthSession = Auth_Session_Type;

export const auth_session_response_doc = auth_session_doc.pick({
    id: true,
    user_id: true,
    organization_id: true,
    ip_address: true,
    user_agent: true,
    expires_at: true,
    is_session_active: true,
    last_active_at: true,
    created_at: true,
    updated_at: true,
});

export type Auth_Session_Response_Type = z.infer<typeof auth_session_response_doc>;
export type TAuthSessionResponse = Auth_Session_Response_Type;

export const auth_session_create_doc = auth_session_doc;

export type Auth_Session_Create_Type = z.infer<typeof auth_session_create_doc>;

export const auth_session_update_organization_id_doc = z.object({
    id: ulid_doc,
    selected_organization_id: ulid_doc,
    updated_at: date_doc,
});

export type Auth_Session_Update_Organization_Id_Type = z.infer<
    typeof auth_session_update_organization_id_doc
>;