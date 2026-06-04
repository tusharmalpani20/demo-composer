import fastifyPassport from '@fastify/passport';
import { AUTH_COOKIE_NAME } from '@repo/constants';
import { Auth_Session_Type, Organization_Role_Type, Organization_Type, response_message, User_Type } from '@repo/types';
import { FastifyInstance, FastifyRequest, PassportUser } from 'fastify';
import fs from 'fs';
import { Algorithm } from 'jsonwebtoken';
import { ExtractJwt, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { Service_Success_Response_Type } from '../common/constants/response_structure.constants';
import { path_to_pub_key } from '../common/jwt_issuer/jwt_issuer';
import { Authentication_Service } from '../module/authentication/service/authentication.service';



const PUB_KEY = fs.readFileSync(path_to_pub_key, 'utf8');


const cookieExtractor = (request: FastifyRequest) => {
    return request.cookies?.[`${AUTH_COOKIE_NAME}`] || null;
};


const options = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor
    ]),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256'] as Algorithm[],
};

export const configure_passport = (app: FastifyInstance) => {

    app.register(fastifyPassport.initialize());

    fastifyPassport.use(new JwtStrategy(options, async (jwt_payload: { sub: string }, done: VerifiedCallback) => {
        try {

            const auth_session_response = await Authentication_Service.validate_session(jwt_payload.sub);

            if (auth_session_response.code == 401 && auth_session_response.status == response_message.enum.error) {
                return done(null, false);
            }

            const user = (auth_session_response as Service_Success_Response_Type).result.user as User_Type;

            const auth_session = (auth_session_response as Service_Success_Response_Type).result.auth_session as Auth_Session_Type;

            const update_cookie = (auth_session_response as Service_Success_Response_Type).result.update_cookie;

            const organization = (auth_session_response as Service_Success_Response_Type).result.organization as Organization_Type;

            const organization_role = (auth_session_response as Service_Success_Response_Type).result.organization_role as Organization_Role_Type;

            const passportUser: PassportUser = {
                ...user,
                __organization_role: organization_role,
                __organization: organization,
                __auth_session: auth_session,
                __update_cookie: update_cookie
            };

            return done(null, passportUser);

        } catch (error) {
            return done(error, false);
        }
    }));
};
