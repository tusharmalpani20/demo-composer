import { Contact_Schema_Messages, contact_type_enum_doc } from "@repo/constants";
import { z } from "zod";
import {
    boolean_preprocess_doc,
    date_doc,
    email_doc,
    phone_doc,
    phone_country_code_doc,
    ulid_doc,
    version_doc
} from "../../common/common.schema";
import { organization_doc } from "../../organization/schema/organization.schema";

const contact_display_name_doc = z.string().min(1, {
    message: Contact_Schema_Messages.min_display_name,
}).max(255, {
    message: Contact_Schema_Messages.max_display_name,
});

export const contact_doc = z.object({
    id: ulid_doc,
    display_name: contact_display_name_doc,
    email: email_doc.nullish(),
    phone: phone_doc.nullish(),
    phone_country_code: phone_country_code_doc.nullish(),
    company_name: z.string().min(1, {
        message: Contact_Schema_Messages.min_company_name,
    }).max(255, {
        message: Contact_Schema_Messages.max_company_name,
    }).nullish(),
    contact_type: contact_type_enum_doc,
    metadata: z.any().nullish(),
    organization_id: organization_doc.shape.id,

    is_deleted: boolean_preprocess_doc,
    deleted_at: date_doc.nullish(),
    deleted_by_id: ulid_doc.nullish(),

    version: version_doc,
    created_by_id: ulid_doc.nullish(),
    updated_by_id: ulid_doc.nullish(),
    created_at: date_doc,
    updated_at: date_doc,
});

export type Contact_Type = z.infer<typeof contact_doc>;
export type TContact = Contact_Type;

export const contact_field_enum_doc = z.enum(Object.keys(
    contact_doc.shape
) as [string, ...string[]]);

export const EContactField = contact_field_enum_doc;

export type Contact_Field_Enum_Type = z.infer<typeof contact_field_enum_doc>;
export type TContactField = Contact_Field_Enum_Type;

export const contact_search_list_item_doc = contact_doc.pick({
    id: true,
    display_name: true,
    email: true,
    contact_type: true,
});

export type Contact_Search_List_Item_Type = z.infer<typeof contact_search_list_item_doc>;
export type TContactSearchListItem = Contact_Search_List_Item_Type;

export const contact_create_doc = contact_doc.pick({
    id: true,
    display_name: true,
    email: true,
    phone: true,
    phone_country_code: true,
    company_name: true,
    contact_type: true,
    metadata: true,
    organization_id: true,
    created_at: true,
    updated_at: true,
    created_by_id: true,
    updated_by_id: true,
});

export type Contact_Create_Type = z.infer<typeof contact_create_doc>;
export type TContactCreate = Contact_Create_Type;

export const contact_create_validation_doc = contact_doc.pick({
    display_name: true,
    email: true,
    phone: true,
    phone_country_code: true,
    company_name: true,
    contact_type: true,
    metadata: true,
}).strict();

export type Contact_Create_Validation_Type = z.infer<typeof contact_create_validation_doc>;
export type TContactCreateValidation = Contact_Create_Validation_Type;

export const contact_update_doc = contact_doc.pick({
    id: true,
    display_name: true,
    email: true,
    phone: true,
    phone_country_code: true,
    company_name: true,
    contact_type: true,
    metadata: true,
    version: true,
    updated_at: true,
    updated_by_id: true,
}).partial({
    display_name: true,
    email: true,
    phone: true,
    phone_country_code: true,
    company_name: true,
    contact_type: true,
    metadata: true,
});

export type Contact_Update_Type = z.infer<typeof contact_update_doc>;
export type TContactUpdate = Contact_Update_Type;

export const contact_update_validation_doc = contact_update_doc.pick({
    id: true,
    display_name: true,
    email: true,
    phone: true,
    phone_country_code: true,
    company_name: true,
    contact_type: true,
    metadata: true,
    version: true,
}).strict().refine(
    (data) =>
        data.display_name !== undefined
        || data.email !== undefined
        || data.phone !== undefined
        || data.phone_country_code !== undefined
        || data.company_name !== undefined
        || data.contact_type !== undefined
        || data.metadata !== undefined,
    { message: "At least one field must be provided" }
);

export type Contact_Update_Validation_Type = z.infer<typeof contact_update_validation_doc>;
export type TContactUpdateValidation = Contact_Update_Validation_Type;

export const contact_delete_validation_doc = z.object({
    id: contact_doc.shape.id,
    version: version_doc,
});

export type Contact_Delete_Validation_Type = z.infer<typeof contact_delete_validation_doc>;
export type TContactDeleteValidation = Contact_Delete_Validation_Type;
