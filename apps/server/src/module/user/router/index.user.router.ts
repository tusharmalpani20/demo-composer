import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { user_routes } from './user.router';
import { user_me_routes } from './user_me.router';
import { user_asset_routes } from './user_asset.router';

export const index_user_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    fastify.register(user_me_routes, {
        prefix: '/me'
    });

    fastify.register(user_asset_routes, {
        prefix: '/asset'
    });

    fastify.register(user_routes);

}
