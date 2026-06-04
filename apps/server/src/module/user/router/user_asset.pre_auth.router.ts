import {
    api_error_response_doc,
    ulid_doc
} from '@repo/types';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { User_Asset_Controller } from '../controller/user_asset.controller';


export const user_asset_pre_auth_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: 'GET',
        url: '/profile-picture/:user_id',
        schema: {
            tags: ['user/asset'],
            description: 'Get user profile picture without authentication',
            params: z.object({
                user_id: ulid_doc
            }),
            response: {
                200: z.any(),
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Asset_Controller.get_profile_picture
    });
}
