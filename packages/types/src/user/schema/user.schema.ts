import {
    user_identity_provider_enum_doc,
    User_Schema_Messages
} from "@repo/constants";
import { z } from "zod";
import {
    boolean_preprocess_doc,
    date_doc,
    email_doc,
    phone_doc,
    timezone_doc,
    ulid_doc,
    version_doc
} from "../../common/common.schema";
import { organization_doc } from "../../organization/schema/organization.schema";

const user_first_name_doc = z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string().min(1, {
        message: User_Schema_Messages.min_first_name
    }).max(100, {
        message: User_Schema_Messages.max_first_name
    })
);

const user_last_name_doc = z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string().min(1, {
        message: User_Schema_Messages.min_last_name
    }).max(100, {
        message: User_Schema_Messages.max_last_name
    })
);

const user_full_name_doc = z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string().min(1, {
        message: User_Schema_Messages.min_full_name
    }).max(200, {
        message: User_Schema_Messages.max_full_name
    })
);

const user_username_doc = z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string().min(1, {
        message: User_Schema_Messages.min_username
    }).max(100, {
        message: User_Schema_Messages.max_username
    })
);

const user_password_before_hash_doc = z.string().min(8, {
    message: User_Schema_Messages.min_password,
}).max(255, {
    message: User_Schema_Messages.max_password,
});

const user_password_doc = z.string().min(8, {
    message: User_Schema_Messages.min_password
}).max(255, {
    message: User_Schema_Messages.max_password
});

const user_phone_doc = phone_doc;

const user_email_doc = email_doc;

const user_phone_country_code_doc = z.string().min(1);


export const user_common_doc = {
    user_first_name_doc,
    user_last_name_doc,
    user_full_name_doc,
    user_username_doc,
    user_password_before_hash_doc,
    user_password_doc,
    user_phone_doc,
    user_email_doc,
    user_phone_country_code_doc,
}

export const user_doc = z.object({
    id: ulid_doc,
    organization_id: organization_doc.shape.id,
    role_id: ulid_doc,
    role_name: z.string().min(1).max(255),
    is_primary_user: boolean_preprocess_doc,
    first_name: user_first_name_doc,
    last_name: user_last_name_doc,
    full_name: user_full_name_doc,
    username: user_username_doc,
    email: user_email_doc,

    phone: user_phone_doc.nullish(),
    phone_country_code: user_phone_country_code_doc.nullish(),

    password: user_password_doc.nullish(),

    identity_provider: user_identity_provider_enum_doc,
    identity_provider_user_id: z.string().max(255).nullish(),

    is_active: boolean_preprocess_doc,
    last_login_at: date_doc.nullish(),

    timezone: timezone_doc,

    is_deleted: boolean_preprocess_doc,
    deleted_at: date_doc.nullish(),
    deleted_by_id: ulid_doc.nullish(),

    version: version_doc,
    created_at: date_doc,
    updated_at: date_doc,
    created_by_id: ulid_doc.nullish(),
    updated_by_id: ulid_doc.nullish(),
});
export type User_Type = z.infer<typeof user_doc>;
export type TUser = User_Type;

export const user_field_enum_doc = z.enum(Object.keys(
    user_doc.shape
) as [string, ...string[]]);

export const EUserField = user_field_enum_doc;

export type User_Field_Enum_Type = z.infer<typeof user_field_enum_doc>;
export type TUserField = User_Field_Enum_Type;

export const user_search_list_item_doc = user_doc.pick({
    id: true,
    organization_id: true,
    role_name: true,
    first_name: true,
    last_name: true,
    full_name: true,
    username: true,
    email: true,
    phone: true,
    phone_country_code: true,
    is_active: true,
    timezone: true,
});
export type User_Search_List_Item_Type = z.infer<typeof user_search_list_item_doc>;
export type TUserSearchListItem = User_Search_List_Item_Type;

export const user_create_doc = user_doc.pick({
    id: true,
    organization_id: true,
    role_id: true,
    role_name: true,
    is_primary_user: true,
    first_name: true,
    last_name: true,
    full_name: true,
    username: true,
    email: true,
    phone: true,
    phone_country_code: true,
    password: true,
    identity_provider: true,
    identity_provider_user_id: true,
    timezone: true,
    created_at: true,
    updated_at: true,
    created_by_id: true,
    updated_by_id: true,
});
export type User_Create_Type = z.infer<typeof user_create_doc>;
export type TUserCreate = User_Create_Type;

export type User_Signup_Create_Body_Type = Omit<
    User_Create_Type,
    "organization_id" | "role_id" | "role_name" | "is_primary_user"
>;
export type TUserSignupCreateBody = User_Signup_Create_Body_Type;

export const user_create_validation_doc = user_create_doc.pick({
    first_name: true,
    last_name: true,
    username: true,
    email: true,
    phone: true,
    phone_country_code: true,
    password: true,
    timezone: true,
    created_by_id: true,
    updated_by_id: true,
}).strict();
export type User_Create_Validation_Type = z.infer<typeof user_create_validation_doc>;
export type TUserCreateValidation = User_Create_Validation_Type;

export const user_update_doc = user_doc.pick({
    id: true,
    first_name: true,
    last_name: true,
    full_name: true,
    timezone: true,
    updated_at: true,
    updated_by_id: true,
}).partial({
    first_name: true,
    last_name: true,
    full_name: true,
    timezone: true,
});
export type User_Update_Type = z.infer<typeof user_update_doc>;
export type TUserUpdate = User_Update_Type;

export const user_update_validation_doc = user_update_doc.pick({
    id: true,
    first_name: true,
    last_name: true,
    timezone: true,
}).strict();
export type User_Update_Validation_Type = z.infer<typeof user_update_validation_doc>;
export type TUserUpdateValidation = User_Update_Validation_Type;

export const user_soft_delete_doc = user_doc.pick({
    id: true,
    deleted_at: true,
    deleted_by_id: true,
    updated_at: true,
    updated_by_id: true,
}).strict();
export type User_Soft_Delete_Type = z.infer<typeof user_soft_delete_doc>;
export type TUserSoftDelete = User_Soft_Delete_Type;

export const user_soft_delete_validation_doc = user_soft_delete_doc.pick({
    id: true,
}).extend({
    version : version_doc,
}).strict();

export type User_Soft_Delete_Validation_Type = z.infer<typeof user_soft_delete_validation_doc>;
export type TUserSoftDeleteValidation = User_Soft_Delete_Validation_Type;