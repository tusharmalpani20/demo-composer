import {
    Otp_Verification_For_Enum,
    otp_verification_send_by_enum_doc,
    otp_verification_send_to_type_enum_doc
} from "@repo/constants";
import { OTP_Verification_Create_Type } from "@repo/types";
import { ulid } from "ulid";
import { Otp_Token_Helper } from "./otp_token.helper";


const generate_otp_code = (
    otp_length: number
): string => {
    return Math.floor(10 ** (otp_length - 1) + Math.random() * (10 ** otp_length - 10 ** (otp_length - 1))).toString();
}

const generate_otp_for_phone = async (
    phone: string,
    phone_country_code: string,
    otp_for: Otp_Verification_For_Enum,
    expires_in_minutes: number = 10,
    otp_length: number = 6
): Promise<{
    otp_create_doc: OTP_Verification_Create_Type,
    otp_token: string
}> => {

    const expires_at = new Date(Date.now() + expires_in_minutes * 60 * 1000);

    const otp_create_doc: OTP_Verification_Create_Type = {
        id: ulid(),
        send_to: `${phone_country_code}${phone}`,
        send_to_type: otp_verification_send_to_type_enum_doc.enum.phone,

        otp_code: generate_otp_code(otp_length),
        otp_for: otp_for,
        otp_send_by: otp_verification_send_by_enum_doc.enum.whatsapp,

        metadata: {
            phone_country_code: phone_country_code,
            phone: phone
        },

        ip_address: null,
        user_agent: null,

        expires_at,

        created_at: new Date(),
        updated_at: new Date()
    };

    const otp_token = await Otp_Token_Helper.sign_otp_token(otp_create_doc.id, otp_create_doc.send_to);

    return {
        otp_create_doc,
        otp_token
    };
}

const generate_otp_for_email = async (
    email: string,
    otp_for: Otp_Verification_For_Enum,
    expires_in_minutes: number = 10,
    otp_length: number = 6
): Promise<{
    otp_create_doc: OTP_Verification_Create_Type,
    otp_token: string
}> => {

    const expires_at = new Date(Date.now() + expires_in_minutes * 60 * 1000);

    const otp_create_doc: OTP_Verification_Create_Type = {
        id: ulid(),
        send_to: email,
        send_to_type: otp_verification_send_to_type_enum_doc.enum.email,

        otp_code: generate_otp_code(otp_length),
        otp_for: otp_for,
        otp_send_by: otp_verification_send_by_enum_doc.enum.email,

        metadata: {
            email: email
        },

        ip_address: null,
        user_agent: null,

        expires_at,

        created_at: new Date(),
        updated_at: new Date()
    };

    const otp_token = await Otp_Token_Helper.sign_otp_token(otp_create_doc.id, otp_create_doc.send_to);

    return {
        otp_create_doc,
        otp_token
    };
}

export const Send_Otp_Helper = {
    generate_otp_for_phone,
    generate_otp_for_email
}