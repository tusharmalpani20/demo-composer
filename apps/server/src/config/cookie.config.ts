import { FastifyCookieOptions } from '@fastify/cookie'
import { is_production_runtime } from "./runtime.config";

const local_cookie_secret = "ossie-local-cookie-secret";

export const get_cookie_config = (): FastifyCookieOptions => {
    const production = is_production_runtime();
    const secret = process.env.COOKIE_SECRET || "";

    if (production && !secret) {
        throw new Error("COOKIE_SECRET must be defined in production");
    }

    if (production && secret.length < 20) {
        throw new Error("COOKIE_SECRET must be at least 20 characters in production");
    }

    return {
        secret: secret || local_cookie_secret,
        hook: 'onRequest',
        parseOptions: {
            httpOnly: production,
            secure: production,
            sameSite: 'lax',
            path: '/',
            ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
        }
    };
};
