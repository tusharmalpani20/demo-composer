import {
    Auth_Session_Type,
    Auth_Session_Update_Organization_Id_Type,
    ULID_Type,
    User_Type
} from "@repo/types";
import { session_organization_error_message } from "../../../common/constants/error_message.constant";
import {
    response_message,
    Service_Response_Structure_Type
} from "../../../common/constants/response_structure.constants";
import { Auth_Session_Model } from "../model/auth_session.model";

const update_selected_org_for_current_user_session = async (
    organization_id: ULID_Type,
    auth_session: Auth_Session_Type,
    user: User_Type
): Promise<Service_Response_Structure_Type> => {

    if (organization_id !== user.organization_id) {
        return {
            code: session_organization_error_message.organization_mismatch.code,
            status: response_message.enum.error,
            error_message: session_organization_error_message.organization_mismatch.message,
            error_type: session_organization_error_message.organization_mismatch.type,
            error_response: [
                {
                    error_message: session_organization_error_message.organization_mismatch.message,
                    field: "organization_id",
                    error_type: session_organization_error_message.organization_mismatch.type
                }
            ]
        };
    }

    const auth_session_update_current_org_id: Auth_Session_Update_Organization_Id_Type = {
        id: auth_session.id,
        selected_organization_id: organization_id,
        updated_at: new Date()
    };

    await Auth_Session_Model.update_selected_organization_id(
        auth_session_update_current_org_id
    );

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user,
            auth_session,
        }
    };
};

const logout = async (
    session_id: ULID_Type
): Promise<Service_Response_Structure_Type> => {

    await Auth_Session_Model.delete_by_id(session_id);

    return {
        code: 200,
        status: response_message.enum.success,
        result: null
    };
};

export const Post_Authentication_Service = {
    update_selected_org_for_current_user_session,
    logout,
};
