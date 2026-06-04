import {
    otp_verification_for_enum_doc,
    otp_verification_send_to_type_enum_doc,
    otp_verification_status_enum_doc,
    user_identity_provider_enum_doc,
} from "@repo/constants";
import {
    Auth_Session_Create_Type,
    Auth_Session_Type,
    Organization_Role_Type,
    Organization_Type,
    OTP_Verification_Type,
    OTP_Verification_Update_Type,
    response_message,
    Signin_Query_Params_Type,
    Signin_With_Password_Validation_Type,
    Signup_With_Email_Query_Params_Type,
    Signup_With_Email_Validation_Type,
    Signup_With_Email_Verify_Otp_Query_Params_Type,
    Signup_With_Email_Verify_Otp_Validation_Type,
    ULID_Type,
    user_field_enum_doc,
    User_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { ulid } from "ulid";
import { default_auth_session_expires_in } from "../../../common/constants/common.constant";
import { authentication_error_message, user_error_message } from "../../../common/constants/error_message.constant";
import {
    Service_Error_Response_Type,
    Service_Response_Structure_Type,
    Service_Success_Response_Type
} from "../../../common/constants/response_structure.constants";
import { issue_jwt } from "../../../common/jwt_issuer/jwt_issuer";
import { Password } from "../../../common/services/password.common.service";
import { Organization_Model } from "../../organization/model/organization.model";
import { Organization_Role_Model } from "../../organization/model/organization_role.model";
import { User_Model } from "../../user/model/user.model";
import { User_Service } from "../../user/service/user.service";
import { Otp_Token_Helper } from "../helper/otp_token.helper";
import { Send_Otp_Helper } from "../helper/send_otp.helper";
import { Auth_Session_Model } from "../model/auth_session.model";
import { Otp_Verification_Model } from "../model/otp_verification.model";


const signin_with_password = async (
    data: Signin_With_Password_Validation_Type,
    query_params: Signin_Query_Params_Type,
    client_info: { ip_address: string, user_agent: string | undefined }
): Promise<Service_Response_Structure_Type> => {

    const check_user = await User_Model.find_for_signin(data.username);

    if (check_user.rows.length == 0) {
        return {
            code: user_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [
                {
                    message: user_error_message.not_found.message,
                    field: user_field_enum_doc.enum.username,
                    type: user_error_message.not_found.type
                },
            ],
        };
    }

    const user_detail = check_user.rows[0] as User_Type;

    if (user_detail.password == null) {
        return {
            code: authentication_error_message.invalid_password_or_username.code,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: user_field_enum_doc.enum.username,
                    type: authentication_error_message.invalid_password_or_username.type
                },
            ]
        };
    }

    const is_password_correct = await Password.compare(user_detail.password, data.password);

    if (!is_password_correct) {
        return {
            code: authentication_error_message.invalid_password_or_username.code,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: user_field_enum_doc.enum.password,
                    type: authentication_error_message.invalid_password_or_username.type
                }
            ]
        };
    }

    const organization_detail = await Organization_Model.find_by_id(user_detail.organization_id);
    const organization_role_detail = await Organization_Role_Model.find_by_id(user_detail.role_id);

    const auth_session_create_data: Auth_Session_Create_Type = {
        id: ulid(),
        user_id: user_detail.id,
        organization_id: user_detail.organization_id,
        identity_provider: user_identity_provider_enum_doc.enum.orca,
        jwt_token: "",
        ip_address: client_info.ip_address,
        user_agent: client_info.user_agent,
        expires_at: new Date(Date.now() + default_auth_session_expires_in),
        is_session_active: true,
        last_active_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    };

    const auth_token = await issue_jwt(user_detail, auth_session_create_data.id);

    auth_session_create_data.jwt_token = auth_token.token;
    auth_session_create_data.expires_at = auth_token.expires_in;

    const auth_session = await Auth_Session_Model.create(
        auth_session_create_data
    ) as QueryResult<Auth_Session_Type>;

    return {
        code: 201,
        status: response_message.enum.success,
        result: {
            user: user_detail,
            organization: organization_detail.rows[0] as Organization_Type,
            organization_role: organization_role_detail as Organization_Role_Type,
            auth_session: auth_session.rows[0],
            auth_token
        }
    };
};

const signup_with_email = async (
    data: Signup_With_Email_Validation_Type,
    query_params: Signup_With_Email_Query_Params_Type,
    client_info: { ip_address: string, user_agent: string | undefined }
): Promise<Service_Response_Structure_Type> => {

    const check_email = await User_Model.find_by_email(
        data.email
    );

    if (check_email.rows.length > 0) {
        return {
            code: user_error_message.email_already_in_use.code,
            status: response_message.enum.error,
            error_message: user_error_message.email_already_in_use.message,
            error_type: user_error_message.email_already_in_use.type,
            error_response: [
                {
                    message: user_error_message.email_already_in_use.message,
                    field: user_field_enum_doc.enum.email,
                    type: user_error_message.email_already_in_use.type
                },
            ],
        };
    }

    const existing_otp_verification = await Otp_Verification_Model.find_by_send_to_and_send_to_type_and_otp_for(
        data.email,
        otp_verification_send_to_type_enum_doc.enum.email,
        otp_verification_for_enum_doc.enum.signup_verification
    );

    let update_existing_otp: OTP_Verification_Update_Type | null = null;

    if (existing_otp_verification.rows.length > 0) {

        update_existing_otp = {
            id: (existing_otp_verification.rows[0] as OTP_Verification_Type).id as ULID_Type,
            status: otp_verification_status_enum_doc.enum.expired,
            updated_at: new Date(),
        };
    }

    const send_otp = await Send_Otp_Helper.generate_otp_for_email(
        data.email,
        otp_verification_for_enum_doc.enum.signup_verification,
        10,
        6
    );

    send_otp.otp_create_doc.metadata!.first_name = data.first_name;
    send_otp.otp_create_doc.metadata!.last_name = data.last_name;
    send_otp.otp_create_doc.ip_address = client_info.ip_address;
    send_otp.otp_create_doc.user_agent = client_info.user_agent || null;

    await Otp_Verification_Model.create_transaction(
        send_otp.otp_create_doc,
        update_existing_otp
    );

    return {
        code: 201,
        status: response_message.enum.success,
        result: {
            otp_token: send_otp.otp_token,
            email: data.email,
        }
    };
};

const signup_with_email_verify_otp = async (
    data: Signup_With_Email_Verify_Otp_Validation_Type,
    query_params: Signup_With_Email_Verify_Otp_Query_Params_Type,
    client_info: { ip_address: string, user_agent: string | undefined }
): Promise<Service_Response_Structure_Type> => {

    const otp_token_details = await Otp_Token_Helper.verify_otp_token(
        data.otp_token,
        data.otp_code
    );
    if (otp_token_details.status !== response_message.enum.success) {
        return otp_token_details as Service_Error_Response_Type;
    }

    const otp_verification_details = otp_token_details.otp_verification_detail;

    const user_service_response = await User_Service.create_user_from_email(
        otp_verification_details
    );

    const svc = user_service_response as Service_Success_Response_Type;
    const created_user = svc.result.user as User_Type;

    const auth_session_create_data: Auth_Session_Create_Type = {
        id: ulid(),
        user_id: created_user.id,
        identity_provider_session_id: null,
        jwt_token: "",
        ip_address: client_info.ip_address,
        user_agent: client_info.user_agent,
        expires_at: new Date(Date.now() + default_auth_session_expires_in),
        organization_id: created_user.organization_id,
        identity_provider: user_identity_provider_enum_doc.enum.orca,
        is_session_active: true,
        last_active_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    };

    const auth_token = await issue_jwt(
        created_user,
        auth_session_create_data.id,
    );

    auth_session_create_data.jwt_token = auth_token.token;
    auth_session_create_data.expires_at = auth_token.expires_in;

    const auth_session = await Auth_Session_Model.create(
        auth_session_create_data
    ) as QueryResult<Auth_Session_Type>;

    return {
        code: 201,
        status: response_message.enum.success,
        result: {
            auth_token,
            user: svc.result.user,
            organization: svc.result.organization,
            organization_role: svc.result.organization_role,
            auth_session: auth_session.rows[0],
        }
    };
};

const validate_session = async (
    session_id: ULID_Type
): Promise<Service_Response_Structure_Type> => {
    const session_result = await Auth_Session_Model.find_by_id(session_id);

    if (session_result.rows.length === 0) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: "session",
                    type: authentication_error_message.invalid_password_or_username.type,
                },
            ],
        };
    }

    const auth_session = session_result.rows[0] as Auth_Session_Type;

    if (!auth_session.is_session_active || auth_session.expires_at < new Date()) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: "session",
                    type: authentication_error_message.invalid_password_or_username.type,
                },
            ],
        };
    }

    if (!auth_session.organization_id) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: "organization_id",
                    type: authentication_error_message.invalid_password_or_username.type,
                },
            ],
        };
    }

    const user_result = await User_Model.find_by_id(auth_session.user_id);

    if (user_result.rows.length === 0) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: user_error_message.not_found.message,
            error_type: user_error_message.not_found.type,
            error_response: [
                {
                    message: user_error_message.not_found.message,
                    field: user_field_enum_doc.enum.username,
                    type: user_error_message.not_found.type,
                },
            ],
        };
    }

    const user_row = user_result.rows[0] as User_Type;

    if (user_row.organization_id !== auth_session.organization_id) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: "organization_id",
                    type: authentication_error_message.invalid_password_or_username.type,
                },
            ],
        };
    }

    const organization_result = await Organization_Model.find_by_id(
        auth_session.organization_id
    );

    if (organization_result.rows.length === 0) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: "organization",
                    type: authentication_error_message.invalid_password_or_username.type,
                },
            ],
        };
    }

    const organization_role_result = await Organization_Role_Model.find_by_id(user_row.role_id);

    if (organization_role_result === null) {
        return {
            code: 401,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_password_or_username.message,
            error_type: authentication_error_message.invalid_password_or_username.type,
            error_response: [
                {
                    message: authentication_error_message.invalid_password_or_username.message,
                    field: "organization_role",
                    type: authentication_error_message.invalid_password_or_username.type,
                },
            ],
        };
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            user: user_row,
            auth_session,
            organization: organization_result.rows[0] as Organization_Type,
            organization_role: organization_role_result as Organization_Role_Type,
            update_cookie: false,
        },
    };
};

export const Authentication_Service = {
    signin_with_password,
    signup_with_email,
    signup_with_email_verify_otp,
    validate_session,
};
