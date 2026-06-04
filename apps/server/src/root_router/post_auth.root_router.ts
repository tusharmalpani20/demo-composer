import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { index_contact_routes } from '../module/contact/router/index.contact.router';
import { index_organization_routes } from '../module/organization/router/index.organization.router';

export const post_auth_root_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    fastify.register(index_organization_routes);
    fastify.register(index_contact_routes);

}
