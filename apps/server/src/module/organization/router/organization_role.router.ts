import {
    api_error_response_doc,
    common_detail_params_doc,
    organization_role_create_response_doc,
    organization_role_create_validation_doc,
    organization_role_delete_response_doc,
    organization_role_delete_validation_doc,
    organization_role_detail_response_doc,
    organization_role_list_query_params_doc,
    organization_role_list_response_doc,
    organization_role_update_response_doc,
    organization_role_update_validation_doc
} from '@repo/types';
import {
    FastifyInstance,
    FastifyPluginAsync
} from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Organization_Role_Controller } from '../controller/organization_role.controller';


export const organization_role_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: 'POST',
        url: '/',
        schema: {
            tags: ['organization/role'],
            description: 'Create a new organization role',
            body: organization_role_create_validation_doc,
            response: {
                201: organization_role_create_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Organization_Role_Controller.create
    });

    app.route({
        method: 'PUT',
        url: '/',
        schema: {
            tags: ['organization/role'],
            description: 'Update an organization role',
            body: organization_role_update_validation_doc,
            response: {
                200: organization_role_update_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Organization_Role_Controller.update
    });

    app.route({
        method: 'GET',
        url: '/:id',
        schema: {
            tags: ['organization/role'],
            description: 'Get an organization role by id',
            params: common_detail_params_doc,
            response: {
                200: organization_role_detail_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Organization_Role_Controller.find_by_id
    });

    app.route({
        method: 'DELETE',
        url: '/:id/:version',
        schema: {
            tags: ['organization/role'],
            description: 'Delete an organization role by id',
            params: organization_role_delete_validation_doc,
            response: {
                200: organization_role_delete_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Organization_Role_Controller.soft_delete_by_id
    });

    app.route({
        method: 'GET',
        url: '/',
        schema: {
            tags: ['organization/role'],
            description: 'Get all organization roles',
            querystring: organization_role_list_query_params_doc,
            response: {
                200: organization_role_list_response_doc,
                '4xx': api_error_response_doc,
                '5xx': api_error_response_doc
            },
        },
        handler: Organization_Role_Controller.get_all
    });

}
