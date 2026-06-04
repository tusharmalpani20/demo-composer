import { 
    Organization_Schema_Messages
} from "@repo/constants";
import { z } from "zod";
import { 
    boolean_preprocess_doc,
    date_doc, 
    email_doc, 
    file_path_doc,
    phone_country_code_doc,
    phone_doc, 
    timezone_doc, 
    ulid_doc, 
    version_doc
} from "../../common/common.schema";

const organization_name_doc = z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1, {
        message: Organization_Schema_Messages.min_name
    }).max(255, {
        message: Organization_Schema_Messages.max_name
    })
);

//TODO : add website validation
const organization_website_doc = z.string().min(1, {
    message: Organization_Schema_Messages.min_website
}).max(255, {
    message: Organization_Schema_Messages.max_website
});

export const organization_doc = z.object({
    id: ulid_doc,
    name: organization_name_doc,
    description: z.string().nullish(),
    website: organization_website_doc.nullish(),
    logo: file_path_doc.nullish(),
    email: email_doc.nullish(),
    phone: phone_doc.nullish(),
    phone_country_code: phone_country_code_doc.nullish(),
    timezone: timezone_doc,

    is_deleted: boolean_preprocess_doc,
    deleted_at: date_doc.nullish(),

    version: version_doc,
    created_at: date_doc,
    updated_at: date_doc
});
export type Organization_Type = z.infer<typeof organization_doc>;
export type TOrganization = Organization_Type;

export const organization_create_doc = organization_doc.pick({
    id: true,
    name: true,
    description: true,
    website: true,
    logo: true,
    email: true,
    phone: true,
    phone_country_code: true,
    timezone: true,
    created_at: true,
    updated_at: true
});
export type Organization_Create_Type = z.infer<typeof organization_create_doc>;
export type TOrganizationCreate = Organization_Create_Type;

//TODO :add a provision to upload logo
export const organization_create_validation_doc = organization_create_doc.pick({
    name: true,
    description: true,
    website: true,
    email: true,
    phone: true,
    phone_country_code: true,
    timezone: true
}).strict();
export type Organization_Create_Validation_Type = z.infer<typeof organization_create_validation_doc>;
export type TOrganizationCreateValidation = Organization_Create_Validation_Type;


export const organization_update_doc = organization_doc.pick({
    id: true,
    name: true,
    description: true,
    website: true,
    logo: true,
    email: true,
    phone: true,
    phone_country_code: true,
    timezone: true,
    version: true,
    updated_at: true
}).partial({
    name: true,
    description: true,
    website: true,
    logo: true,
    email: true,
    phone: true,
    phone_country_code: true,
    timezone: true,
});
export type Organization_Update_Type = z.infer<typeof organization_update_doc>;
export type TOrganizationUpdate = Organization_Update_Type;

export const organization_update_validation_doc = organization_update_doc.pick({
    id: true,
    name: true,
    description: true,
    website: true,
    logo: true,
    email: true,
    phone: true,
    phone_country_code: true,
    timezone: true,
    version: true,
}).strict();
export type Organization_Update_Validation_Type = z.infer<typeof organization_update_validation_doc>;
export type TOrganizationUpdateValidation = Organization_Update_Validation_Type;
