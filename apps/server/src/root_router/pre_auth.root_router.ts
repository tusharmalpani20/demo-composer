import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { index_authentication_routes } from '../module/authentication/router/index.authentication.router';
import { index_user_pre_auth_routes } from '../module/user/router/index.user.pre_auth.router';
import { public_instance_routes } from '../modules/public-instance/public-instance.routes';


export const pre_auth_root_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.register(public_instance_routes, {
        prefix: "/public",
    });

    fastify.register(index_authentication_routes, {
        prefix: "/authentication",
    });

    fastify.register(index_user_pre_auth_routes, {
        prefix: "/user",
    });
}
