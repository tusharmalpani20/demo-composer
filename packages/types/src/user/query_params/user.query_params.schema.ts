import { common_page_size } from "@repo/constants";
import { z } from "zod";
import {
    boolean_preprocess_doc,
    create_order_by_doc,
    order_by_enum,
    page_number_doc,
    page_size_doc,
    timezone_doc
} from "../../common/index.common.schema";
import { user_field_enum_doc } from "../schema/user.schema";

export const user_list_query_params_doc = z.object({

    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    username: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    phone_country_code: z.string().nullish(),

    is_active: boolean_preprocess_doc.nullish(),

    timezone: timezone_doc.nullish(),

    page_number: page_number_doc.default(1).optional(),
    page_size: page_size_doc.default(common_page_size).optional(),
    is_search: boolean_preprocess_doc.default(false).optional(),

    order_by: create_order_by_doc(user_field_enum_doc).default(`${user_field_enum_doc.enum.created_at}:${order_by_enum.enum.asc}`).optional(),
});

export type User_List_Query_Params_Type = z.infer<typeof user_list_query_params_doc>;
export type TUserListQueryParams = User_List_Query_Params_Type;

const user_list_query_params_catch_doc = user_list_query_params_doc.pick({
    first_name: true,
    last_name: true,
    username: true,
    email: true,
    phone: true,
    phone_country_code: true,

    is_active: true,

    timezone: true,
}).extend({
    page_number: page_number_doc.catch(1),
    page_size: page_size_doc.catch(common_page_size),
    is_search: boolean_preprocess_doc.catch(false),

    order_by: create_order_by_doc(user_field_enum_doc).catch(`${user_field_enum_doc.enum.created_at}:${order_by_enum.enum.asc}`)
});

export const user_list_query_params_refine_doc = user_list_query_params_catch_doc.transform(
    (data) => {
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

export type User_List_Query_Params_Refine_Type = z.infer<typeof user_list_query_params_refine_doc>;
export type TUserListQueryParamsRefine = User_List_Query_Params_Refine_Type;

export { user_list_query_params_refine_doc as user_list_search_params_refine_doc };
