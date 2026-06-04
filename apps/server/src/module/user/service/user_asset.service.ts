import {
    user_profile_picture_provider_enum
} from "@repo/constants"
import {
    response_message,
    ULID_Type,
    User_Asset_Create_Type,
    User_Asset_Profile_Picture_Upload_Type,
    User_Asset_Type,
    User_Asset_Update_Type,
    User_Type
} from "@repo/types"
import { QueryResult } from "pg"
import { general_error_message, user_error_message } from "../../../common/constants/error_message.constant"
import {
    Service_Response_Structure_Type
} from "../../../common/constants/response_structure.constants"
import { User_Asset_Helper } from "../helper/user_asset.helper"
import { User_Asset_Model } from "../model/user_asset.model"

const upload_profile_picture = async (
    data: User_Asset_Profile_Picture_Upload_Type,
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    const create_file_path_for_file = User_Asset_Helper.user_profile_picture_file_path_generator(
        user.id,
        data.upload_file.file_extension
    );

    const check_user_asset_existence = await User_Asset_Model.find_by_user_id(user.id);

    let user_asset: User_Asset_Type;

    if (check_user_asset_existence.rows.length > 0) {
        //if it already exists, then we will update the profile picture of the user
        const update_user_asset_data: User_Asset_Update_Type = {
            user_id: user.id,
            profile_picture_provider: user_profile_picture_provider_enum.enum.orca,
            profile_picture_path: create_file_path_for_file,
            profile_picture_url: `${process.env.API_URL}/api/v1/user/asset/profile-picture/${user.id}`,
            updated_at: new Date(),
        }

        const update_user_asset_response = await User_Asset_Model.update(update_user_asset_data, user) as QueryResult<User_Asset_Type>;

        user_asset = update_user_asset_response.rows[0] as User_Asset_Type;
    } else {
        //if it does not exist, then we will create a new entry for the user
        const create_user_asset_data: User_Asset_Create_Type = {
            user_id: user.id,
            organization_id: user.organization_id,
            profile_picture_provider: user_profile_picture_provider_enum.enum.orca,
            profile_picture_path: create_file_path_for_file,
            profile_picture_url: `${process.env.API_URL}/api/v1/user/asset/profile-picture/${user.id}`,
            created_at: new Date(),
            updated_at: new Date()
        }

        const create_user_asset_response = await User_Asset_Model.create(create_user_asset_data, user) as QueryResult<User_Asset_Type>;

        user_asset = create_user_asset_response.rows[0] as User_Asset_Type;
    }

    // event_emitter.emit(
    //     Event_Emitter_Events.User_Asset_Events.user_profile_picture_upload,
    //     user_asset,
    //     data.upload_file.filepath
    // );

    return {
        code: 201,
        status: response_message.enum.success,
        result: {
            user_asset: user_asset
        }
    }
}

const find_by_id = async (
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    const user_asset = await User_Asset_Model.find_by_user_id(user.id);

    if (user_asset.rowCount == 0) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [
                {
                    message: user_error_message.not_found.message,
                    field: "user_id",
                    type: user_error_message.not_found.type
                }
            ]
        }
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user_asset: user_asset.rows[0]
        }
    }
}

const get_profile_picture = async (
    user_id: ULID_Type
): Promise<Service_Response_Structure_Type> => {
    const user_asset = await User_Asset_Model.find_by_user_id(user_id);

    const user_asset_row = user_asset.rows[0] as User_Asset_Type;

    if (user_asset_row == null) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [
                {
                    message: user_error_message.not_found.message,
                    field: "user_id",
                    type: user_error_message.not_found.type
                }
            ]
        }
    }

    //IF THE PROVIDER IS SCALE, THEN WE WILL RETURN BASE64 ENCODED IMAGE

    if (user_asset_row.profile_picture_provider === user_profile_picture_provider_enum.enum.orca) {
        const profile_picture_path = user_asset_row.profile_picture_path;
        const profile_picture_base64 = profile_picture_path ? await User_Asset_Helper.get_profile_picture_base64(profile_picture_path) : null;

        if (profile_picture_base64 == null) {
            return {
                code: general_error_message.not_found_error.code,
                status: response_message.enum.error,
                error_message: general_error_message.not_found_error.message,
                error_type: general_error_message.not_found_error.type,
                error_response: [
                    {
                        message: general_error_message.not_found_error.message,
                        field: "profile_picture_path",
                        type: general_error_message.not_found_error.type
                    }
                ]
            }
        }

        return {
            code: 200,
            status: response_message.enum.success,
            result: {
                profile_picture_provider: user_asset_row.profile_picture_provider,
                profile_picture_base64: profile_picture_base64
            }
        }
    } else {
        return {
            code: 200,
            status: response_message.enum.success,
            result: {
                profile_picture_provider: user_asset_row.profile_picture_provider,
                profile_picture_url: user_asset_row.profile_picture_url
            }
        }
    }


}

export const User_Asset_Service = {
    upload_profile_picture,
    find_by_id,
    get_profile_picture
}
