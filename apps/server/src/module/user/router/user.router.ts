import {
    api_error_response_doc,
    ulid_doc,
    user_detail_response_doc,
    user_list_response_doc,
    user_list_search_params_refine_doc
} from '@repo/types';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { User_Controller } from '../controller/user.controller';


export const user_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // app.route({
    //     method: 'POST',
    //     url: '/',
    //     schema: {
    //         tags: ['users'],
    //         description: 'Create a new user',
    //         body: user_create_doc,
    //         response: {
    //             201: response_structure(z.object({
    //                      user: user_response_doc
    //              })),
    //             '4xx': error_response_structure,
    //             '5xx': error_response_structure
    //         },
    //     },
    //     handler: User_Controller.create
    // });

    app.route({
        method: 'GET',
        url: '/:id',
        schema: {
            tags: ['users'],
            description: 'Get a user by id',
            params: z.object({
                id: ulid_doc
            }),
            response: {
                200: user_detail_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Controller.find_by_id
    });

    app.route({
        method: 'GET',
        url: '/',
        schema: {
            tags: ['users'],
            description: 'Get all users',
            querystring: user_list_search_params_refine_doc,
            response: {
                200: user_list_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Controller.get_all
    });
}
