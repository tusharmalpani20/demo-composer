import {
    api_error_response_doc,
    user_asset_detail_response_doc,
    user_asset_profile_picture_upload_doc,
    user_asset_profile_picture_upload_response_doc
} from '@repo/types';
import {
    FastifyInstance,
    FastifyPluginAsync
} from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { User_Asset_Controller } from '../controller/user_asset.controller';


export const user_asset_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: 'POST',
        url: '/profile-picture',
        schema: {
            tags: ['user/asset'],
            description: 'Upload a user profile picture',
            consumes: ['multipart/form-data'],
            body: user_asset_profile_picture_upload_doc,
            response: {
                200: user_asset_profile_picture_upload_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Asset_Controller.upload_profile_picture
    });

    app.route({
        method: 'GET',
        url: '/',
        schema: {
            tags: ['user/asset'],
            description: 'Get a user asset details',
            response: {
                200: user_asset_detail_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: User_Asset_Controller.find_by_id
    });
}
