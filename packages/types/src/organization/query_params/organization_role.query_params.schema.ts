import { common_page_size } from "@repo/constants";
import { z } from "zod";
import { 
    boolean_preprocess_doc, 
    create_order_by_doc, 
    order_by_enum, 
    page_number_doc,
    page_size_doc
 } from "../../common/index.common.schema";
import { organization_doc } from "../schema/organization.schema";
import { organization_role_field_enum_doc } from "../schema/organization_role.schema";


export const organization_role_list_query_params_doc = z.object({
    name: z.string().optional(),
    is_deleted: boolean_preprocess_doc.default(false).optional(),
    page_number: page_number_doc.default(1).optional(),
    page_size: page_size_doc.default(common_page_size).optional(),
    is_search: boolean_preprocess_doc.default(false).optional(),
    order_by: create_order_by_doc(organization_role_field_enum_doc).default(`${organization_role_field_enum_doc.enum.created_at}:${order_by_enum.enum.asc}`).optional(),
});

export const organization_role_list_query_params_catch_doc = organization_role_list_query_params_doc.pick({
    name: true,
}).extend({
    is_deleted: boolean_preprocess_doc.catch(false),
    page_number: page_number_doc.catch(1),
    page_size: page_size_doc.catch(common_page_size),
    is_search: boolean_preprocess_doc.catch(false),
    order_by: create_order_by_doc(organization_role_field_enum_doc).catch(`${organization_role_field_enum_doc.enum.created_at}:${order_by_enum.enum.asc}`),
})

export const organization_role_list_query_params_refine_doc = organization_role_list_query_params_catch_doc.transform(
    (data) => {
        //if is_search is true, page_number and page_size are not required
        if (data.is_search) {
            return {
                ...data,
                page_number: undefined,
                page_size: undefined,
            };
        }
        return data;
    }
).superRefine((data, ctx) => {
    if (!data.is_search) {
        if (!data.page_number) {
            ctx.addIssue({
                code: "custom",
                message: "page_number is required when is_search is false",
                path: ["page_number"]
            });
        }

        if (!data.page_size) {
            ctx.addIssue({
                code: "custom",
                message: "page_size is required when is_search is false",
                path: ["page_size"]
            });
        }
    } else {
        //if is_search is true, page_number and page_size are not required
        if (data.page_number) {
            ctx.addIssue({
                code: "custom",
                message: "page_number is required when is_search is false",
                path: ["page_number"]
            });
        }

        if (data.page_size) {
            ctx.addIssue({
                code: "custom",
                message: "page_size is required when is_search is false",
                path: ["page_size"]
            });
        }
    }
});

export type Organization_Role_List_Query_Params_Type = z.infer<typeof organization_role_list_query_params_doc>;
export type TOrganizationRoleListQueryParams = Organization_Role_List_Query_Params_Type;

export const organization_role_list_query_params_model_doc = organization_role_list_query_params_doc.extend({
    organization_id: organization_doc.shape.id,
});

export type Organization_Role_List_Query_Params_Model_Type = z.infer<typeof organization_role_list_query_params_model_doc>;
export type TOrganizationRoleListQueryParamsModel = Organization_Role_List_Query_Params_Model_Type;

