// import { AUTH_COOKIE_NAME } from "@repo/constants";
// import {
//     Auth_Session_Type,
//     ULID_Type,
//     User_Type
// } from "@repo/types";
// import { FastifyReply, FastifyRequest } from "fastify";
// import { service_response_handler } from "../../../common/helper_function/helper";
// import { Post_Authentication_Service } from "../service/post_authentication.service";

// const update_selected_org_for_current_user_session = async (
//     request: FastifyRequest,
//     reply: FastifyReply
// ) => {

//     const user = request.user as User_Type;

//     const auth_session = request.auth_session as Auth_Session_Type;

//     const organization_id = (request.body as any).organization_id as ULID_Type;

//     const response = await Post_Authentication_Service.update_selected_org_for_current_user_session(
//         organization_id,
//         auth_session,
//         user
//     );

//     const return_value = service_response_handler({
//         response,
//         original_url: request.originalUrl,
//     });

//     reply.status(return_value.code).send(return_value);
// };

// const logout = async (
//     request: FastifyRequest,
//     reply: FastifyReply
// ) => {

//     const user = request.user as User_Type;

//     const auth_session = request.auth_session as Auth_Session_Type;

//     const response = await Post_Authentication_Service.logout(
//         auth_session.id
//     );

//     reply.clearCookie(AUTH_COOKIE_NAME);
//     // reply.redirect(url);
//     // rediret to the signin page
// }

// export const Post_Authentication_Controller = {
//     update_selected_org_for_current_user_session,
//     logout,
// };