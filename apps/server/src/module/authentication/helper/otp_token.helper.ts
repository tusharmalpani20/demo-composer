import {
    otp_verification_status_enum_doc
} from '@repo/constants';
import {
    OTP_Verification_Type,
    response_message,
    Response_Message_Type
} from '@repo/types';
import * as crypto from 'crypto';
import { authentication_error_message } from '../../../common/constants/error_message.constant';
import { Service_Error_Response_Type } from '../../../common/constants/response_structure.constants';
import { Otp_Verification_Model } from '../model/otp_verification.model';

interface TokenData {
    otp_id: string;
    phone: string;
    expires_at: number;
}

const otp_token_store = new Map<string, TokenData>();

const sign_otp_token = async (
    otp_id: string,
    phone: string,
    expires_in_minutes: number = 10
): Promise<string> => {
    const secret = crypto.randomBytes(32).toString('hex');

    const hash = crypto.createHash('sha256')
        .update(`${otp_id}:${phone}:${secret}`)
        .digest('hex');

    const token_data: TokenData = {
        otp_id,
        phone,
        expires_at: Date.now() + (expires_in_minutes * 60 * 1000)
    };

    otp_token_store.set(hash, token_data);

    return `${hash}.${secret}`;
};

const verify_otp_token = async (
    token: string,
    otp_code: string
): Promise<{
    otp_verification_detail: OTP_Verification_Type,
    status: Response_Message_Type
} |
    Service_Error_Response_Type
> => {
    try {
        const [hash, secret] = token.split('.');

        if (!hash || !secret) {
            return {
                code: authentication_error_message.invalid_otp_token.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.invalid_otp_token.message,
                error_type: authentication_error_message.invalid_otp_token.type,
                error_response: [{
                    message: authentication_error_message.invalid_otp_token.message,
                    field: "otp_token",
                    type: authentication_error_message.invalid_otp_token.type
                }]
            }
        }

        const token_data = otp_token_store.get(hash);
        if (!token_data) {
            return {
                code: authentication_error_message.invalid_otp_token.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.invalid_otp_token.message,
                error_type: authentication_error_message.invalid_otp_token.type,
                error_response: [{
                    message: authentication_error_message.invalid_otp_token.message,
                    field: "otp_token",
                    type: authentication_error_message.invalid_otp_token.type
                }]
            }
        }

        if (Date.now() > token_data.expires_at) {
            otp_token_store.delete(hash);
            return {
                code: authentication_error_message.otp_expired.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.otp_expired.message,
                error_type: authentication_error_message.otp_expired.type,
                error_response: [{
                    message: authentication_error_message.otp_expired.message,
                    field: "otp_token",
                    type: authentication_error_message.otp_expired.type
                }]
            }
        }

        const verify_hash = crypto.createHash('sha256')
            .update(`${token_data.otp_id}:${token_data.phone}:${secret}`)
            .digest('hex');

        if (verify_hash !== hash) {
            return {
                code: authentication_error_message.invalid_otp_token.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.invalid_otp_token.message,
                error_type: authentication_error_message.invalid_otp_token.type,
                error_response: [{
                    message: authentication_error_message.invalid_otp_token.message,
                    field: "otp_token",
                    type: authentication_error_message.invalid_otp_token.type
                }]
            }
        }

        const otp_verification_details = await Otp_Verification_Model.increment_attempts(token_data.otp_id);
        const otp_row = otp_verification_details.rows[0];

        if (!otp_row) {
            return {
                code: authentication_error_message.otp_not_found.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.otp_not_found.message,
                error_type: authentication_error_message.otp_not_found.type,
                error_response: [{
                    message: authentication_error_message.otp_not_found.message,
                    field: "otp_token",
                    type: authentication_error_message.otp_not_found.type
                }]
            }
        }

        if (otp_row.status != otp_verification_status_enum_doc.enum.pending) {
            return {
                code: authentication_error_message.otp_already_verified.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.otp_already_verified.message,
                error_type: authentication_error_message.otp_already_verified.type,
                error_response: [{
                    message: authentication_error_message.otp_already_verified.message,
                    field: "otp_token",
                    type: authentication_error_message.otp_already_verified.type
                }]
            }
        }

        if (otp_row.otp_code != otp_code) {
            return {
                code: authentication_error_message.invalid_otp_code.code,
                status: response_message.enum.error,
                error_message: authentication_error_message.invalid_otp_code.message,
                error_type: authentication_error_message.invalid_otp_code.type,
                error_response: [{
                    message: authentication_error_message.invalid_otp_code.message,
                    field: "otp_code",
                    type: authentication_error_message.invalid_otp_code.type
                }]
            }
        }

        otp_token_store.delete(hash);
        await Otp_Verification_Model.update_otp_status(
            otp_row.id,
            otp_verification_status_enum_doc.enum.verified
        );
        return {
            otp_verification_detail: otp_row,
            status: response_message.enum.success
        };
    } catch (error) {
        return {
            code: authentication_error_message.invalid_otp_token.code,
            status: response_message.enum.error,
            error_message: authentication_error_message.invalid_otp_token.message,
            error_type: authentication_error_message.invalid_otp_token.type,
            error_response: [{
                message: authentication_error_message.invalid_otp_token.message,
                field: "otp_token",
                type: authentication_error_message.invalid_otp_token.type
            }]
        }
    }
};

export const Otp_Token_Helper = {
    sign_otp_token,
    verify_otp_token
};
