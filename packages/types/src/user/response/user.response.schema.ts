import { z } from "zod";
import { positive_int_doc } from "../../common/common.schema";
import { api_200_response_doc } from "../../common/response_structure.schema";
import { user_doc, user_search_list_item_doc } from "../schema/user.schema";

export const user_response_doc = user_doc.pick({
    id: true,
    organization_id: true,
    role_id: true,
    role_name: true,
    is_primary_user: true,

    first_name: true,
    last_name: true,
    full_name: true,
    username: true,
    phone: true,
    phone_country_code: true,
    email: true,

    last_login_at: true,
    timezone: true,

    version: true,
    created_at: true,
    updated_at: true,
}).extend({
    password: z.preprocess((val) => {
        if (val == null) {
            return false;
        }
        return true;
    }, z.boolean())
});

export type User_Response_Type = z.infer<typeof user_response_doc>;
export type TUserResponse = User_Response_Type;

export const user_list_item_response_doc = user_response_doc;
export type User_List_Item_Response_Type = z.infer<typeof user_list_item_response_doc>;
export type TUserListItemResponse = User_List_Item_Response_Type;

export const user_search_list_item_response_doc = user_search_list_item_doc;
export type User_Search_List_Item_Response_Type = z.infer<typeof user_search_list_item_response_doc>;
export type TUserSearchListItemResponse = User_Search_List_Item_Response_Type;

export const user_detail_response_doc = api_200_response_doc(z.object({
    user: user_response_doc
}));
export type TUserDetailResponse = z.infer<typeof user_detail_response_doc>;

export const user_list_response_doc = api_200_response_doc(z.discriminatedUnion(
    "is_search",
    [
        z.object({
            user_list: z.array(user_search_list_item_response_doc),
            total_count: positive_int_doc,
            is_search: z.literal(true)
        }),
        z.object({
            user_list: z.array(user_list_item_response_doc),
            total_count: positive_int_doc,
            is_search: z.literal(false)
        })
    ]
));
export type TUserListResponse = z.infer<typeof user_list_response_doc>;
