import {
    AUTH_COOKIE_NAME
} from "@repo/constants";

import { response_message, Signin_Query_Params_Type, Signin_With_Password_Validation_Type, Signup_With_Email_Query_Params_Type, Signup_With_Email_Validation_Type, Signup_With_Email_Verify_Otp_Query_Params_Type, Signup_With_Email_Verify_Otp_Validation_Type } from "@repo/types";
import {
    FastifyReply,
    FastifyRequest
} from "fastify";
import {
    service_response_handler
} from "../../../common/helper_function/helper";
import {
    Authentication_Service
} from "../service/authentication.service";

const signin_with_password = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as Signin_With_Password_Validation_Type;

    const query_params = request.query as Signin_Query_Params_Type;

    // Capture client info
    const client_info = {
        ip_address: request.ip || request.headers['x-forwarded-for'] as string,
        user_agent: request.headers['user-agent']
    };

    const response = await Authentication_Service.signin_with_password(
        data, 
        query_params,
        client_info
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    if (query_params.is_web_request === true) {
        if (response.status === response_message.enum.success) {
            // Set only our JWT cookie
            // Converting expires_at to seconds from now for maxAge
            const maxAgeInSeconds = Math.floor(
                (new Date(response.result.auth_session.expires_at).getTime() - Date.now()) / 1000
            );
            reply.setCookie(AUTH_COOKIE_NAME, response.result.auth_session.jwt_token.split(' ')[1], {
                // This will merge with your global cookie config
                maxAge: maxAgeInSeconds,
            }).status(201).send(return_value);
        } else {
            reply.redirect(`${process.env.AUTH_REDIRECT_URL}sign-in?error=Authentication failed`);
        }
    } else {
        reply.status(201).send(return_value);
    }
};

const signup_with_email = async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as Signup_With_Email_Validation_Type;

    const query_params = request.query as Signup_With_Email_Query_Params_Type;

    // Capture client info
    const client_info = {
        ip_address: request.ip || request.headers['x-forwarded-for'] as string,
        user_agent: request.headers['user-agent']
    };

    const response = await Authentication_Service.signup_with_email(
        data,
        query_params,
        client_info
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
}

const signup_with_email_verify_otp = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as Signup_With_Email_Verify_Otp_Validation_Type;

    const query_params = request.query as Signup_With_Email_Verify_Otp_Query_Params_Type;

    const client_info = {
        ip_address: request.ip || request.headers['x-forwarded-for'] as string,
        user_agent: request.headers['user-agent']
    };

    const response = await Authentication_Service.signup_with_email_verify_otp(
        data,
        query_params,
        client_info
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    if (query_params.is_web_request === true) {

        if (response.status === response_message.enum.success) {
            // Set only our JWT cookie
            // Converting expires_at to seconds from now for maxAge
            const maxAgeInSeconds = Math.floor(
                (new Date(response.result.auth_session.expires_at).getTime() - Date.now()) / 1000
            );
            reply.setCookie(AUTH_COOKIE_NAME, response.result.auth_session.jwt_token.split(' ')[1], {
                // This will merge with your global cookie config
                maxAge: maxAgeInSeconds,
            }).status(201).send(return_value);
        } else {
            reply.redirect(`${process.env.AUTH_REDIRECT_URL}sign-in?error=Authentication failed`);
        }
    } else {
        reply.status(201).send(return_value);
    }
}


export const Authentication_Controller = {
    signin_with_password,
    signup_with_email,
    signup_with_email_verify_otp,
};