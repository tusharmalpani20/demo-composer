import { user_profile_picture_provider_enum } from "@repo/constants";
import {
    ULID_Type,
    User_Asset_Profile_Picture_Upload_Type,
    User_Type
} from "@repo/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { service_response_handler } from "../../../common/helper_function/helper";
import { User_Asset_Service } from "../service/user_asset.service";


const upload_profile_picture = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as User_Asset_Profile_Picture_Upload_Type;

    const response = await User_Asset_Service.upload_profile_picture(data, request.user as User_Type);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};


const find_by_id = async (request: FastifyRequest, reply: FastifyReply) => {

    const response = await User_Asset_Service.find_by_id(request.user as User_Type);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
}


const get_profile_picture = async (request: FastifyRequest, reply: FastifyReply) => {

    const user_id = (request.params as any).user_id as ULID_Type;

    const response = await User_Asset_Service.get_profile_picture(user_id);

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    if (return_value.code === 200) {
        if (return_value.result.profile_picture_provider === user_profile_picture_provider_enum.enum.orca) {
            reply.status(return_value.code).send(return_value.result.profile_picture_base64);
        } else {
            reply.status(return_value.code).send(return_value.result.profile_picture_url);
        }
    } else {
        reply.status(return_value.code).send(return_value);
    }
}

export const User_Asset_Controller = {
    upload_profile_picture,
    find_by_id,
    get_profile_picture
};