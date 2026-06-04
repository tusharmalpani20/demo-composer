// import {
//     api_error_response_doc,
//     post_auth_logout_response_doc,
//     post_auth_update_selected_org_response_doc,
//     signin_doc
// } from '@repo/types';
// import {
//     FastifyInstance,
//     FastifyPluginAsync
// } from 'fastify';
// import { ZodTypeProvider } from 'fastify-type-provider-zod';
// import { Post_Authentication_Controller } from '../controller/post_authentication.controller';

// export const post_authentication_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
//     const app = fastify.withTypeProvider<ZodTypeProvider>();

//     app.route({
//         method: 'POST',
//         url: '/update-selected-org/:organization_id',
//         schema: {
//             tags: ['post-authentication'],
//             description: 'This route is used to update the selected organization for the current user session',
//             body: signin_doc,
//             response: {
//                 200: post_auth_update_selected_org_response_doc,
//                 '4xx': api_error_response_doc,
//                 '5xx': api_error_response_doc
//             },
//         },
//         handler: Post_Authentication_Controller.update_selected_org_for_current_user_session
//     });

//     app.route({
//         method: 'POST',
//         url: '/logout',
//         schema: {
//             tags: ['post-authentication'],
//             description: 'This route is used to logout the current user session',
//             response: {
//                 200: post_auth_logout_response_doc,
//                 '4xx': api_error_response_doc,
//                 '5xx': api_error_response_doc
//             },
//         },
//         handler: Post_Authentication_Controller.logout
//     });
// }
