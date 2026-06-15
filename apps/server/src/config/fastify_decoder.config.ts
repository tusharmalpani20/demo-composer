import { 
    FastifyInstance, 
    FastifyPluginCallback, 
    FastifyPluginOptions
} from 'fastify'
import fp from 'fastify-plugin'

type RequestAuthSession = {
    id: string;
    user_id: string;
    organization_id: string;
    org_user_id?: string;
    expires_at?: string | Date;
};

type RequestOrganization = {
    id: string;
    name: string;
};

	declare module 'fastify' {
	    interface FastifyRequest {
	        session: unknown | null
	        auth_session: RequestAuthSession | null,
	        organization: RequestOrganization | null,
	    }
}

const decorator_plugin: FastifyPluginCallback = (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: (error?: Error) => void
) => {

    fastify.decorateRequest('session', null)

    fastify.decorateRequest('auth_session', null)

    fastify.decorateRequest('organization', null)

    done()
}

export default fp(decorator_plugin, {
    name: 'request-decorators',
    fastify: '5.x'
})
