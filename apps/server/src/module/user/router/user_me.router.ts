import {
    api_error_response_doc,
    user_me_detail_response_doc,
    user_me_set_password_response_doc,
    user_me_set_password_validation_doc,
    user_me_update_password_response_doc,
    user_me_update_password_validation_doc,
    user_me_update_response_doc,
    user_me_update_validation_doc
} from '@repo/types';
import {
    FastifyInstance,
    FastifyPluginAsync
} from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { User_Me_Controller } from '../controller/user_me.controller';


export const user_me_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: 'PUT',
        url: '/details',
        schema: {
            tags: ['user/me'],
            description: 'Update logged in user details',
            body: user_me_update_validation_doc,
            response: {
                200: user_me_update_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Me_Controller.update_details
    });

    app.route({
        method: 'PUT',
        url: '/password/set',
        schema: {
            tags: ['user/me'],
            description: 'Set logged in user password',
            body: user_me_set_password_validation_doc,
            response: {
                200: user_me_set_password_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Me_Controller.set_password
    });

    app.route({
        method: 'PUT',
        url: '/password/update',
        schema: {
            tags: ['user/me'],
            description: 'Update logged in user password',
            body: user_me_update_password_validation_doc,
            response: {
                200: user_me_update_password_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Me_Controller.update_password
    });

    app.route({
        method: 'GET',
        url: '/details',
        schema: {
            tags: ['user/me'],
            description: 'Get logged in user details',
            response: {
                200: user_me_detail_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Me_Controller.get_details
    });

}
