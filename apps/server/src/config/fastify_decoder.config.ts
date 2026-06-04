import { Auth_Session_Type, Organization_Type } from '@repo/types'
import { 
    FastifyInstance, 
    FastifyPluginCallback, 
    FastifyPluginOptions
} from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
    interface FastifyRequest {
        session: any | null
        auth_session: Auth_Session_Type | null,
        organization: Organization_Type | null,
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
