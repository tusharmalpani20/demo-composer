import { Organization_Role_Schema_Messages } from "@repo/constants";
import { z } from "zod";
import { boolean_doc, date_doc, ulid_doc, version_doc } from "../../common/common.schema";
import { organization_doc } from "./organization.schema";

export const organization_role_doc = z.object({
    id: ulid_doc,

    name : z.string().min(1, {
        message: Organization_Role_Schema_Messages.min_name
    }).max(255, {
        message: Organization_Role_Schema_Messages.max_name
    }),

    description: z.string().nullish(),

    is_system_defined: boolean_doc,
    organization_id: organization_doc.shape.id,

    is_deleted: boolean_doc,
    deleted_at: date_doc.nullish(),
    deleted_by_id: ulid_doc.nullish(),

    version: version_doc,
    created_at: date_doc,
    updated_at: date_doc,
    created_by_id: ulid_doc.nullish(),
    updated_by_id: ulid_doc.nullish(),
});

export type Organization_Role_Type = z.infer<typeof organization_role_doc>;
export type TOrganization_Role = Organization_Role_Type;

export const organization_role_field_enum_doc = z.enum(Object.keys(
    organization_role_doc.shape
) as [string, ...string[]]);

export const EOrganizationRoleField = organization_role_field_enum_doc;

export type Organization_Role_Field_Enum_Type = z.infer<typeof organization_role_field_enum_doc>;
export type TOrganizationRoleField = Organization_Role_Field_Enum_Type;


export const organization_role_search_list_item_doc = organization_role_doc.pick({
    id: true,
    name: true,
});

export type Organization_Role_Search_List_Item_Type = z.infer<typeof organization_role_search_list_item_doc>;
export type TOrganizationRoleSearchListItem = Organization_Role_Search_List_Item_Type;

export const organization_role_create_doc = organization_role_doc.pick({
    id: true,
    name: true,
    description: true,

    is_system_defined: true,
    organization_id: true,

    created_at: true,
    updated_at: true,
    created_by_id: true,
    updated_by_id: true,
});

export type Organization_Role_Create_Type = z.infer<typeof organization_role_create_doc>;
export type TOrganizationRoleCreate = Organization_Role_Create_Type;


export const organization_role_create_validation_doc = organization_role_create_doc.pick({
    name: true,
    description: true,
}).strict();

export type Organization_Role_Create_Validation_Type = z.infer<typeof organization_role_create_validation_doc>;
export type TOrganizationRoleCreateValidation = Organization_Role_Create_Validation_Type;

export const organization_role_update_doc = organization_role_doc.pick({
    id: true,
    name: true,
    description: true,
    version: true,
    updated_at: true,
    updated_by_id: true,
}).partial({
    name: true,
    description: true,
});

export type Organization_Role_Update_Type = z.infer<typeof organization_role_update_doc>;
export type TOrganizationRoleUpdate = Organization_Role_Update_Type;

export const organization_role_update_validation_doc = organization_role_update_doc.pick({
    id: true,
    name: true,
    description: true,
    version: true,
}).partial({
    name: true,
    description: true,
}).strict().refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: "At least one of name or description must be provided" }
);

export type Organization_Role_Update_Validation_Type = z.infer<typeof organization_role_update_validation_doc>;
export type TOrganizationRoleUpdateValidation = Organization_Role_Update_Validation_Type;

export const organization_role_delete_doc = organization_role_doc.pick({
    id: true,
    version: true,
    is_deleted: true,
    deleted_at: true,
    deleted_by_id: true,
    updated_at: true,
    updated_by_id: true,
}).strict();

export type Organization_Role_Delete_Type = z.infer<typeof organization_role_delete_doc>;
export type TOrganizationRoleDelete = Organization_Role_Delete_Type;

export const organization_role_delete_validation_doc = organization_role_delete_doc.pick({
    id: true,
    version: true,
}).strict();

export type Organization_Role_Delete_Validation_Type = z.infer<typeof organization_role_delete_validation_doc>;
export type TOrganizationRoleDeleteValidation = Organization_Role_Delete_Validation_Type;