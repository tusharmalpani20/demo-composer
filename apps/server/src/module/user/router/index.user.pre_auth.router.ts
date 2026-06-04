import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { user_asset_routes } from './user_asset.router';
import { user_asset_pre_auth_routes } from './user_asset.pre_auth.router';

export const index_user_pre_auth_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.register(user_asset_pre_auth_routes, {
        prefix: '/asset'
    });
}
