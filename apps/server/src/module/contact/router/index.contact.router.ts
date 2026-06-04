import { Organization_Type, User_Type } from "@repo/types";
import {
    FastifyInstance,
    FastifyPluginAsync
} from "fastify";
import { Organization_Model } from "../../organization/model/organization.model";
import { contact_routes } from "./contact.router";

export const index_contact_routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    fastify.addHook("preHandler", async (request) => {
        const user = request.user as User_Type;
        const org_result = await Organization_Model.find_by_id(user.organization_id);
        request.organization = (org_result.rows[0] as Organization_Type) ?? null;
    });

    fastify.register(contact_routes, { prefix: "/contact" });
};
