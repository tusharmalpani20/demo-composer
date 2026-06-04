import { common_page_size, contact_type_enum_doc } from "@repo/constants";
import { z } from "zod";
import {
    boolean_preprocess_doc,
    create_order_by_doc,
    order_by_enum,
    page_number_doc,
    page_size_doc,
} from "../../common/index.common.schema";
import { organization_doc } from "../../organization/schema/organization.schema";
import { contact_field_enum_doc } from "../schema/contact.schema";

export const contact_list_query_params_doc = z.object({
    display_name: z.string().optional(),
    email: z.string().optional(),
    contact_type: contact_type_enum_doc.optional(),
    is_deleted: boolean_preprocess_doc.default(false).optional(),
    page_number: page_number_doc.default(1).optional(),
    page_size: page_size_doc.default(common_page_size).optional(),
    is_search: boolean_preprocess_doc.default(false).optional(),
    order_by: create_order_by_doc(contact_field_enum_doc).default(`${contact_field_enum_doc.enum.created_at}:${order_by_enum.enum.desc}`).optional(),
});

export const contact_list_query_params_catch_doc = contact_list_query_params_doc.pick({
    display_name: true,
    email: true,
}).extend({
    contact_type: contact_type_enum_doc.optional(),
    is_deleted: boolean_preprocess_doc.catch(false),
    page_number: page_number_doc.catch(1),
    page_size: page_size_doc.catch(common_page_size),
    is_search: boolean_preprocess_doc.catch(false),
    order_by: create_order_by_doc(contact_field_enum_doc).catch(`${contact_field_enum_doc.enum.created_at}:${order_by_enum.enum.desc}`),
});

export const contact_list_query_params_refine_doc = contact_list_query_params_catch_doc.transform(
    (data) => {
        if (data.is_search) {
            (data.page_number as unknown as undefined) = undefined;
            (data.page_size as unknown as undefined) = undefined;
        }
        return data;
    }
).superRefine((data, ctx) => {
    if (!data.is_search) {
        if (!data.page_number) {
            ctx.addIssue({
                code: "custom",
                message: "page_number is required when is_search is false",
                path: ["page_number"],
            });
        }
        if (!data.page_size) {
            ctx.addIssue({
                code: "custom",
                message: "page_size is required when is_search is false",
                path: ["page_size"],
            });
        }
    } else {
        if (data.page_number) {
            ctx.addIssue({
                code: "custom",
                message: "page_number is required when is_search is false",
                path: ["page_number"],
            });
        }
        if (data.page_size) {
            ctx.addIssue({
                code: "custom",
                message: "page_size is required when is_search is false",
                path: ["page_size"],
            });
        }
    }
});

export type Contact_List_Query_Params_Type = z.infer<typeof contact_list_query_params_doc>;
export type TContactListQueryParams = Contact_List_Query_Params_Type;

export const contact_list_query_params_model_doc = contact_list_query_params_doc.extend({
    organization_id: organization_doc.shape.id,
});

export type Contact_List_Query_Params_Model_Type = z.infer<typeof contact_list_query_params_model_doc>;
export type TContactListQueryParamsModel = Contact_List_Query_Params_Model_Type;
