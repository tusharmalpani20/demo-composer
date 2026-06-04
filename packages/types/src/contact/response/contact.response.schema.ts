import { z } from "zod";
import { positive_int_doc } from "../../common/common.schema";
import { api_200_response_doc, api_201_response_doc } from "../../common/response_structure.schema";
import { contact_doc, contact_search_list_item_doc } from "../schema/contact.schema";

export const contact_response_doc = contact_doc;

export type Contact_Response_Type = z.infer<typeof contact_response_doc>;
export type TContactResponse = Contact_Response_Type;

export const contact_create_response_doc = api_201_response_doc(z.object({
    contact: contact_response_doc,
}));

export type TContactCreateResponse = z.infer<typeof contact_create_response_doc>;

export const contact_update_response_doc = api_200_response_doc(z.object({
    contact: contact_response_doc,
}));

export type TContactUpdateResponse = z.infer<typeof contact_update_response_doc>;

export const contact_detail_response_doc = api_200_response_doc(z.object({
    contact: contact_response_doc,
}));

export type TContactDetailResponse = z.infer<typeof contact_detail_response_doc>;

export const contact_delete_response_doc = api_200_response_doc(z.object({
    contact: contact_response_doc,
}));

export type TContactDeleteResponse = z.infer<typeof contact_delete_response_doc>;

export const contact_list_response_doc = api_200_response_doc(z.discriminatedUnion(
    "is_search",
    [
        z.object({
            contacts: z.array(contact_search_list_item_doc),
            total_count: positive_int_doc,
            is_search: z.literal(true),
        }),
        z.object({
            contacts: z.array(contact_response_doc),
            total_count: positive_int_doc,
            is_search: z.literal(false),
        }),
    ]
));

export type TContactListResponse = z.infer<typeof contact_list_response_doc>;
