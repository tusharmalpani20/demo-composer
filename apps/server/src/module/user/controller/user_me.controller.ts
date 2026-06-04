import {
    Auth_Session_Type,
    User_Me_Set_Password_Validation_Type,
    User_Me_Update_Password_Validation_Type,
    User_Me_Update_Validation_Type,
    User_Type
} from "@repo/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { service_response_handler } from "../../../common/helper_function/helper";
import { User_Me_Service } from "../service/user_me.service";


const update_details = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as User_Me_Update_Validation_Type;

    const response = await User_Me_Service.update_details(data, request.user as User_Type);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};

const set_password = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as User_Me_Set_Password_Validation_Type;

    const response = await User_Me_Service.set_password(data, request.user as User_Type);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
}


const update_password = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as User_Me_Update_Password_Validation_Type;

    const response = await User_Me_Service.update_password(data, request.user as User_Type);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
}

const get_details = async (request: FastifyRequest, reply: FastifyReply) => {

    const user = request.user as User_Type;

    const auth_session = request.auth_session as Auth_Session_Type;


    const response = await User_Me_Service.get_details(
        user,
        auth_session
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
}

export const User_Me_Controller = {
    update_details,
    set_password,
    update_password,
    get_details
};