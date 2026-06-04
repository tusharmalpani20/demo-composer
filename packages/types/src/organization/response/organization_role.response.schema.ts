import { z } from "zod";
import { positive_int_doc } from "../../common/common.schema";
import { api_200_response_doc, api_201_response_doc } from "../../common/response_structure.schema";
import { organization_role_doc, organization_role_search_list_item_doc } from "../schema/organization_role.schema";

export const organization_role_response_doc = organization_role_doc;

export type Organization_Role_Response_Type = z.infer<typeof organization_role_response_doc>;
export type TOrganizationRoleResponse = Organization_Role_Response_Type;

export const organization_role_list_item_response_doc = organization_role_response_doc;

export type Organization_Role_List_Item_Response_Type = z.infer<typeof organization_role_list_item_response_doc>;
export type TOrganizationRoleListItemResponse = Organization_Role_List_Item_Response_Type;

export const organization_role_search_list_item_response_doc = organization_role_search_list_item_doc;

export type Organization_Role_Search_List_Item_Response_Type = z.infer<typeof organization_role_search_list_item_response_doc>;
export type TOrganizationRoleSearchListItemResponse = Organization_Role_Search_List_Item_Response_Type;

export const organization_role_create_response_doc = api_201_response_doc(z.object({
    organization_role: organization_role_response_doc
}))

export type TOrganizationRoleCreateResponse = z.infer<typeof organization_role_create_response_doc>


export const organization_role_update_response_doc = api_200_response_doc(z.object({
    organization_role: organization_role_response_doc
}))

export type TOrganizationRoleUpdateResponse = z.infer<typeof organization_role_update_response_doc>


export const organization_role_list_response_doc = api_200_response_doc(z.discriminatedUnion(
    "is_search", [
    z.object({
        organization_roles: z.array(organization_role_search_list_item_response_doc),
        total_count: positive_int_doc,
        is_search: z.literal(true)
    }),
    z.object({
        organization_roles: z.array(organization_role_list_item_response_doc),
        total_count: positive_int_doc,
        is_search: z.literal(false)
    })
]));

export type TOrganizationRoleListResponse = z.infer<typeof organization_role_list_response_doc>

export const organization_role_delete_response_doc = api_200_response_doc(z.object({
    organization_role: organization_role_response_doc
}));

export type TOrganizationRoleDeleteResponse = z.infer<typeof organization_role_delete_response_doc>

export const organization_role_detail_response_doc = api_200_response_doc(z.object({
    organization_role: organization_role_response_doc
}));

export type TOrganizationRoleDetailResponse = z.infer<typeof organization_role_detail_response_doc>
