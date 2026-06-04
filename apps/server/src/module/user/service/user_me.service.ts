import {
    Auth_Session_Type,
    Organization_Type,
    response_message,
    User_Asset_Type,
    User_Me_Set_Password_Validation_Type,
    User_Me_Update_Password_Validation_Type,
    User_Me_Update_Type,
    User_Me_Update_Validation_Type,
    User_Type
} from "@repo/types";
import { user_error_message } from "../../../common/constants/error_message.constant";
import {
    Service_Response_Structure_Type
} from "../../../common/constants/response_structure.constants";
import { Password } from "../../../common/services/password.common.service";
import { Organization_Model } from "../../organization/model/organization.model";
import { Organization_Role_Model } from "../../organization/model/organization_role.model";
import { User_Asset_Model } from "../model/user_asset.model";
import { User_Model } from "../model/user.model";
import { User_Me_Model } from "../model/user_me.model";


const update_details = async (
    data: User_Me_Update_Validation_Type,
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    const user_detail = await User_Model.find_by_id(
        user.id
    );

    const user_detail_row = user_detail.rows[0] as User_Type;

    if (!user_detail_row) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [{
                message: user_error_message.not_found.message,
                field: 'user',
                type: user_error_message.not_found.type
            }]
        };
    }

    const update_data: User_Me_Update_Type = {
        id: user.id,
        updated_at: new Date(),
        first_name: data.first_name,
        last_name: data.last_name
    };

    if (data.first_name || data.last_name) {
        update_data.full_name = `${data.first_name ?? user_detail_row.first_name} ${data.last_name ?? user_detail_row.last_name}`;
    }

    const update_result = await User_Me_Model.update_details_transaction(
        update_data,
        user
    );

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user: update_result.user
        }
    };
};

const set_password = async (
    data: User_Me_Set_Password_Validation_Type,
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    const user_detail = await User_Model.find_by_id(user.id);

    const user_detail_row = user_detail.rows[0] as User_Type;

    if (user_detail_row.password) {
        return {
            code: user_error_message.password_already_set.code,
            status: response_message.enum.error,
            error_message: user_error_message.password_already_set.message,
            error_type: user_error_message.password_already_set.type,
            error_response: [{
                message: user_error_message.password_already_set.message,
                field: 'password',
                type: user_error_message.password_already_set.type
            }]
        };
    }

    const hashed_password = await Password.to_hash(
        data.password
    );

    await User_Me_Model.update_password(
        hashed_password,
        user
    );

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user: user_detail_row
        }
    };
};

const update_password = async (
    data: User_Me_Update_Password_Validation_Type,
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    const user_detail = await User_Model.find_by_id(user.id);

    const user_detail_row = user_detail.rows[0] as User_Type;

    if (!user_detail_row.password) {
        return {
            code: user_error_message.password_not_set.code,
            status: response_message.enum.error,
            error_message: user_error_message.password_not_set.message,
            error_type: user_error_message.password_not_set.type,
            error_response: [{
                message: user_error_message.password_not_set.message,
                field: 'password',
                type: user_error_message.password_not_set.type
            }]
        };
    }

    const is_password_correct = await Password.compare(
        user_detail_row.password as string,
        data.current_password
    );

    if (!is_password_correct) {
        return {
            code: user_error_message.password_incorrect.code,
            status: response_message.enum.error,
            error_message: user_error_message.password_incorrect.message,
            error_type: user_error_message.password_incorrect.type,
            error_response: [{
                message: user_error_message.password_incorrect.message,
                field: 'password',
                type: user_error_message.password_incorrect.type
            }]
        };
    }

    const hashed_password = await Password.to_hash(
        data.password
    );

    await User_Me_Model.update_password(
        hashed_password,
        user
    );

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user: user_detail_row
        }
    };
};

const get_details = async (
    user: User_Type,
    auth_session: Auth_Session_Type
): Promise<Service_Response_Structure_Type> => {
    const user_detail = await User_Model.find_by_id(user.id);

    if (user_detail.rows.length === 0) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [{
                message: user_error_message.not_found.message,
                field: "user",
                type: user_error_message.not_found.type
            }]
        };
    }

    const user_row = user_detail.rows[0] as User_Type;

    const organization_result = await Organization_Model.find_by_id(user_row.organization_id);
    const organization = organization_result.rows[0] as Organization_Type;

    const role_row = await Organization_Role_Model.find_by_id(user_row.role_id);
    if (role_row === null) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [{
                message: user_error_message.not_found.message,
                field: "organization_role",
                type: user_error_message.not_found.type
            }]
        };
    }
    const organization_role = role_row;

    const user_asset_result = await User_Asset_Model.find_by_user_id(user.id);
    const user_asset_row = user_asset_result.rows[0] as User_Asset_Type | undefined;
    const user_asset: User_Asset_Type = user_asset_row ?? {
        user_id: user.id,
        organization_id: user.organization_id,
        profile_picture_provider: null,
        profile_picture_path: null,
        profile_picture_url: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_id: null,
        version: 1,
        created_by_id: null,
        updated_by_id: null,
        created_at: new Date(),
        updated_at: new Date(),
    };

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user: user_row,
            organization,
            organization_role,
            user_asset,
            auth_session,
        },
    };
};


export const User_Me_Service = {
    update_details,
    set_password,
    update_password,
    get_details,
};
