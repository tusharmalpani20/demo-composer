import {
    FastifyInstance,
    FastifyPluginAsync
} from 'fastify';
import { Organization_Type, User_Type } from '@repo/types';
import { Organization_Model } from '../model/organization.model';
import { organization_role_routes } from './organization_role.router';

export const index_organization_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    fastify.addHook('preHandler', async (request) => {
        const user = request.user as User_Type;
        const org_result = await Organization_Model.find_by_id(user.organization_id);
        request.organization = (org_result.rows[0] as Organization_Type) ?? null;
    });

    fastify.register(organization_role_routes, {
        prefix: "/organization/role",
    });
}
