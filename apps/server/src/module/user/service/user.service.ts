
import {
    default_timezone,
    user_identity_provider_enum_doc
} from "@repo/constants";
import {
    Organization_Type,
    Organization_Role_Type,
    OTP_Verification_Type,
    response_message,
    ULID_Type,
    User_Asset_Signup_Create_Type,
    User_List_Query_Params_Type,
    User_Signup_Create_Body_Type,
    User_Type
} from "@repo/types";
import { ulid } from "ulid";
import {
    default_organization_name,
    default_user_first_name,
    default_user_last_name
} from "../../../common/constants/common.constant";
import { user_error_message } from "../../../common/constants/error_message.constant";
import {
    Service_Response_Structure_Type
} from "../../../common/constants/response_structure.constants";
import { Password } from "../../../common/services/password.common.service";
import { Organization_Model } from "../../organization/model/organization.model";
import { Organization_Role_Model } from "../../organization/model/organization_role.model";
import { User_Model } from "../model/user.model";


const create_user_from_email = async (
    data: OTP_Verification_Type
): Promise<Service_Response_Structure_Type> => {

    const user_exists = await User_Model.find_by_email(
        data.send_to as string
    );

    if (user_exists.rows.length > 0) {
        const user_row = user_exists.rows[0] as User_Type;
        const organization_detail = await Organization_Model.find_by_id(user_row.organization_id);
        const role_detail = await Organization_Role_Model.find_by_id(user_row.role_id);
        return {
            code: 200,
            status: response_message.enum.success,
            result: {
                user: user_row,
                organization: organization_detail.rows[0] as Organization_Type,
                organization_role: role_detail as Organization_Role_Type,
            }
        };
    }

    const create_organization_data = {
        id: ulid(),
        name: default_organization_name,
        description: null,
        website: null,
        logo: null,
        email: null,
        phone: null,
        phone_country_code: null,
        timezone: default_timezone,
        created_at: new Date(),
        updated_at: new Date()
    };

    const password = await Password.to_hash("helloworld");

    const user_id = ulid();

    const user_body: User_Signup_Create_Body_Type = {
        id: user_id,
        first_name: data.metadata!.first_name as string ?? default_user_first_name,
        last_name: data.metadata!.last_name as string ?? default_user_last_name,
        full_name: `${data.metadata!.first_name as string ?? default_user_first_name} ${data.metadata!.last_name as string ?? default_user_last_name}`,
        username: data.send_to as string,
        phone: null,
        phone_country_code: null,
        email: data.send_to as string,
        password: password,
        identity_provider: user_identity_provider_enum_doc.enum.orca,
        identity_provider_user_id: null,
        timezone: default_timezone,
        created_at: new Date(),
        updated_at: new Date(),
        created_by_id: null,
        updated_by_id: null,
    };

    const user_asset_body: User_Asset_Signup_Create_Type = {
        user_id: user_id,
        profile_picture_provider: null,
        profile_picture_url: null,
        profile_picture_path: null,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const create_result = await User_Model.create_user_transaction(
        create_organization_data,
        user_body,
        user_asset_body
    );

    return {
        code: 201,
        status: response_message.enum.success,
        result: {
            user: create_result.user,
            organization: create_result.organization,
            organization_role: create_result.organization_role
        }
    };

};

const find_by_id = async (
    id: ULID_Type
): Promise<Service_Response_Structure_Type> => {

    const user_detail = await User_Model.find_by_id(
        id
    );

    if (user_detail.rowCount == 0) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [
                {
                    message: user_error_message.not_found.message,
                    field: "id",
                    type: user_error_message.not_found.type
                }
            ]
        };
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user: user_detail.rows[0]
        }
    };
};

const get_all = async (
    query_params: User_List_Query_Params_Type,
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    const get_all_result = await User_Model.get_all(
        query_params,
        user
    );

    const total_count = query_params.is_search
        ? get_all_result.rows.length
        : get_all_result.rows.length > 0
            ? Number((get_all_result.rows[0] as unknown as { total_count: number }).total_count)
            : 0;

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user_list: get_all_result.rows,
            total_count,
            is_search: query_params.is_search
        }
    };
};

export const User_Service = {
    create_user_from_email,
    find_by_id,
    get_all,
};
