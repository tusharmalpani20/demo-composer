import {
    api_error_response_doc,
    common_detail_params_doc,
    contact_create_response_doc,
    contact_create_validation_doc,
    contact_delete_response_doc,
    contact_delete_validation_doc,
    contact_detail_response_doc,
    contact_list_query_params_doc,
    contact_list_response_doc,
    contact_update_response_doc,
    contact_update_validation_doc,
} from "@repo/types";
import {
    FastifyInstance,
    FastifyPluginAsync
} from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { Contact_Controller } from "../controller/contact.controller";

export const contact_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: "POST",
        url: "/",
        schema: {
            tags: ["contact"],
            description: "Create contact",
            body: contact_create_validation_doc,
            response: {
                201: contact_create_response_doc,
                "4xx": api_error_response_doc,
                "5xx": api_error_response_doc,
            },
        },
        handler: Contact_Controller.create,
    });

    app.route({
        method: "PUT",
        url: "/",
        schema: {
            tags: ["contact"],
            description: "Update contact",
            body: contact_update_validation_doc,
            response: {
                200: contact_update_response_doc,
                "4xx": api_error_response_doc,
                "5xx": api_error_response_doc,
            },
        },
        handler: Contact_Controller.update,
    });

    app.route({
        method: "GET",
        url: "/:id",
        schema: {
            tags: ["contact"],
            description: "Get contact by id",
            params: common_detail_params_doc,
            response: {
                200: contact_detail_response_doc,
                "4xx": api_error_response_doc,
                "5xx": api_error_response_doc,
            },
        },
        handler: Contact_Controller.find_by_id,
    });

    app.route({
        method: "DELETE",
        url: "/:id/:version",
        schema: {
            tags: ["contact"],
            description: "Soft delete contact",
            params: contact_delete_validation_doc,
            response: {
                200: contact_delete_response_doc,
                "4xx": api_error_response_doc,
                "5xx": api_error_response_doc,
            },
        },
        handler: Contact_Controller.soft_delete_by_id,
    });

    app.route({
        method: "GET",
        url: "/",
        schema: {
            tags: ["contact"],
            description: "List contacts",
            querystring: contact_list_query_params_doc,
            response: {
                200: contact_list_response_doc,
                "4xx": api_error_response_doc,
                "5xx": api_error_response_doc,
            },
        },
        handler: Contact_Controller.get_all,
    });
};
