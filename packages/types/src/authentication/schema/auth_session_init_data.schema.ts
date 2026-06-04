import { z } from "zod";
import { date_doc, ulid_doc } from "../../common/common.schema";

export const auth_session_init_data_doc = z.object({
    id: ulid_doc,

    ip_address: z.string(),
    user_agent: z.string().nullish(),

    expires_at: date_doc,

    created_at: date_doc,
    updated_at: date_doc,
});

export type Auth_Session_Init_Data_Type = z.infer<typeof auth_session_init_data_doc>;

export const auth_session_init_data_create_doc = auth_session_init_data_doc;

export type Auth_Session_Init_Data_Create_Type = z.infer<typeof auth_session_init_data_create_doc>;