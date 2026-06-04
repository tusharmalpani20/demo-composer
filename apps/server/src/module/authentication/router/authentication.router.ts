import {
    api_error_response_doc,
    signin_query_params_doc,
    signin_with_password_response_doc,
    signin_with_password_validation_doc,
    signup_with_email_query_params_doc,
    signup_with_email_response_doc,
    signup_with_email_validation_doc,
    signup_with_email_verify_otp_query_params_doc,
    signup_with_email_verify_otp_response_doc,
    signup_with_email_verify_otp_validation_doc
} from '@repo/types';
import {
    FastifyInstance,
    FastifyPluginAsync
} from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Authentication_Controller } from '../controller/authentication.controller';

export const authentication_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: 'POST',
        url: '/signin/password',
        schema: {
            tags: ['authentication'],
            description: 'signin route: the user can signin with their username, phone or email',
            querystring: signin_query_params_doc,
            body: signin_with_password_validation_doc,
            response: {
                201: signin_with_password_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Authentication_Controller.signin_with_password
    });

    app.route({
        method: 'POST',
        url: '/signup/email',
        schema: {
            tags: ['authentication'],
            description: 'Signup with email',
            querystring: signup_with_email_query_params_doc,
            body: signup_with_email_validation_doc,
            response: {
                201: signup_with_email_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Authentication_Controller.signup_with_email
    });

    app.route({
        method: 'POST',
        url: '/signup/email/verify-otp',
        schema: {
            tags: ['authentication'],
            description: 'signup with email verify otp',
            querystring: signup_with_email_verify_otp_query_params_doc,
            body: signup_with_email_verify_otp_validation_doc,
            response: {
                201: signup_with_email_verify_otp_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Authentication_Controller.signup_with_email_verify_otp
    });
}
