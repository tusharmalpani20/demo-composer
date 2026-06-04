import fastifyPassport from '@fastify/passport';
import { AUTH_COOKIE_NAME } from '@repo/constants';
import { Auth_Session_Type } from '@repo/types';
import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { NotAuthorizedError } from '../common/errors/not-authorized-error';
import { post_auth_root_routes } from './post_auth.root_router';
import { pre_auth_root_routes } from './pre_auth.root_router';


export const index_root_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.register(pre_auth_root_routes);

    // Register post-auth routes with authentication
    fastify.register(async (fastify) => {

        // Set shared schema for all routes in this context
        fastify.addHook('onRoute', (routeOptions) => {
            routeOptions.schema = {
                ...routeOptions.schema,
                security: [{ bearerAuth: [] }]
            };
        });


        // Add authentication middleware for all routes in this context
        fastify.addHook('preValidation', fastifyPassport.authenticate('jwt', {
            session: false,
            // authInfo: false  // Optimization: don't need extra auth info
        }));

        // Session management after authentication
        fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {

            // Ensure authentication was successful
            if (!request.user) {
                throw new NotAuthorizedError(request.url, new Date().toISOString());
            }

            // Set session data from authenticated user
            request.auth_session = (request.user as any).__auth_session;

            if ((request.user as any).__update_cookie) {
                const expiresAt = new Date((request.auth_session as Auth_Session_Type).expires_at);
                const maxAgeInSeconds = Math.floor(
                    (expiresAt.getTime() - Date.now()) / 1000
                );

                reply.setCookie(AUTH_COOKIE_NAME, (request.auth_session as Auth_Session_Type).jwt_token, {
                    maxAge: maxAgeInSeconds,
                    httpOnly: true,     // Prevent XSS
                    secure: process.env.NODE_ENV === 'production',  // Secure in production
                    sameSite: 'lax'     // CSRF protection
                });
            }
        });

        
        //Register post-auth routes
        fastify.register(post_auth_root_routes);
    });

}
