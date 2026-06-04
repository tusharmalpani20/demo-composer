import { ULID_Type, User_List_Query_Params_Type, User_Type } from "@repo/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { service_response_handler } from "../../../common/helper_function/helper";
import { User_Service } from "../service/user.service";


// const create = async (request: FastifyRequest, reply: FastifyReply) => {

//     const data = request.body as User_Create_Validation_Type;

//     const response = await User_Service.create(data);

//     const return_value = service_response_handler({
//         response,
//         original_url: request.originalUrl,
//     });

//     reply.status(return_value.code).send(return_value);
// };


const find_by_id = async (request: FastifyRequest, reply: FastifyReply) => {

    const id = (request.params as any).id as ULID_Type;

    const response = await User_Service.find_by_id(id);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};


const get_all = async (request: FastifyRequest, reply: FastifyReply) => {

    const search_params = request.query as User_List_Query_Params_Type;

    const user = request.user as User_Type;

    const response = await User_Service.get_all(search_params, user);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
}



export const User_Controller = {
    // create,
    find_by_id,
    get_all,
};