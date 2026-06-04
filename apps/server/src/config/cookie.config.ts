import { FastifyCookieOptions } from '@fastify/cookie'

/*

To make this even more secure in production, you should:
    Always set a strong COOKIE_SECRET environment variable
    Consider using sameSite: 'strict' if you don't need cross-site functionality
    Consider setting specific domain restrictions
    Consider setting appropriate maxAge or expires values to limit cookie lifetime

*/
export const cookieConfig: FastifyCookieOptions = {
    // The secret is used to sign cookies to prevent tampering
    // - Can be a String, Array (for key rotation), Buffer, or Object
    // - Should be at least 20 bytes long for security
    // - In production, should always be set via environment variables
    secret: process.env.COOKIE_SECRET || 'my-secret',

    // Specifies when cookies should be parsed during the request lifecycle
    // Options: 'onRequest', 'preParsing', 'preHandler', 'preValidation'
    // 'onRequest' is the default and recommended setting
    hook: 'onRequest',

    // Configuration options for parsing and setting cookies
    parseOptions: {
        // httpOnly: true prevents client-side access to the cookie through JavaScript
        // This helps prevent XSS (Cross-Site Scripting) attacks
        httpOnly: process.env.DEV_TYPE === 'production',

        // secure: true ensures cookies are only sent over HTTPS
        // We enable this in production only, but ideally should be always true
        // if your site is served over HTTPS
        secure: process.env.DEV_TYPE === 'production',

        // sameSite controls how the cookie behaves with cross-site requests
        // 'lax' provides a balance between security and usability:
        // - Allows top-level navigation with cookie
        // - Blocks cookie on cross-site POST requests and iframe loads
        // Options: 'strict' | 'lax' | 'none'
        sameSite: 'lax',

        // path specifies the path where the cookie is valid
        // '/' means the cookie is valid for all paths on the domain
        path: '/',

        // domain specifies the domain where the cookie is valid
        domain: process.env.DEV_TYPE === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',

        // Other available options not used here:
        // - domain: limits cookie to specific domain/subdomain
        // - maxAge: sets cookie expiration in seconds
        // - expires: sets specific date for cookie expiration
        // - signed: boolean to enable cookie signing (handled by 'secret' option)
        // - priority: 'low' | 'medium' | 'high' (not fully standardized)
        // - partitioned: boolean for partitioned cookies (not fully standardized)
    }
}
