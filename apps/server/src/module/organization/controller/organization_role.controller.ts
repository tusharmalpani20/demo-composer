import {
    Organization_Role_Create_Validation_Type,
    Organization_Role_Delete_Validation_Type,
    Organization_Role_List_Query_Params_Type,
    Organization_Role_Update_Validation_Type,
    Organization_Type,
    ULID_Type,
    User_Type
} from "@repo/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { service_response_handler } from "../../../common/helper_function/helper";
import { Organization_Role_Service } from "../service/organization_role.service";


const create = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as Organization_Role_Create_Validation_Type;

    const response = await Organization_Role_Service.create(
        data,
        request.user as User_Type,
        request.organization as Organization_Type
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};


const update = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as Organization_Role_Update_Validation_Type;

    const response = await Organization_Role_Service.update(
        data,
        request.user as User_Type,
        request.organization as Organization_Type
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};

const find_by_id = async (request: FastifyRequest, reply: FastifyReply) => {

    const id = (request.params as any).id as ULID_Type;

    const response = await Organization_Role_Service.find_by_id(
        id, 
        request.user as User_Type, 
        request.organization as Organization_Type
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};


const get_all = async (request: FastifyRequest, reply: FastifyReply) => {

    const search_params = request.query as Organization_Role_List_Query_Params_Type;

    const response = await Organization_Role_Service.get_all(
        search_params, 
        request.user as User_Type, 
        request.organization as Organization_Type
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};


const soft_delete_by_id = async (request: FastifyRequest, reply: FastifyReply) => {

    const data = request.body as Organization_Role_Delete_Validation_Type;

    const response = await Organization_Role_Service.soft_delete_by_id(
        data,
        request.user as User_Type,
        request.organization as Organization_Type
    );

    const return_value = service_response_handler({
        response,
        original_url: request.originalUrl,
    });

    reply.status(return_value.code).send(return_value);
};

export const Organization_Role_Controller = {
    create,
    update,
    find_by_id,
    get_all,
    soft_delete_by_id,
};