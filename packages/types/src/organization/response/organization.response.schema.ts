import { 
    z
} from "zod";
import { 
    api_200_response_doc, 
    api_201_response_doc
} from "../../common/response_structure.schema";
import { 
    organization_doc
} from "../schema/organization.schema";

export const organization_response_doc = organization_doc.pick({
    id: true,
    name: true,
    description: true,
    logo: true,
    website: true,
    email: true,
    phone: true,
    phone_country_code: true,
    timezone: true,
    version: true,
    created_at: true,
    updated_at: true
});
export type Organization_Response_Type = z.infer<typeof organization_response_doc>;
export type TOrganizationResponse = Organization_Response_Type;

export const organization_create_response_doc = api_201_response_doc(z.object({
    organization: organization_response_doc
}));
export type TOrganizationCreateResponse = z.infer<typeof organization_create_response_doc>


export const organization_update_response_doc = api_200_response_doc(z.object({
    organization: organization_response_doc
}));
export type TOrganizationUpdateResponse = z.infer<typeof organization_update_response_doc>



export const organization_detail_response_doc = api_200_response_doc(z.object({
    organization: organization_response_doc
}));
export type TOrganizationDetailResponse = z.infer<typeof organization_detail_response_doc>

