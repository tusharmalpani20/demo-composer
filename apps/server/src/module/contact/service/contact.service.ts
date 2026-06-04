import {
    Contact_Create_Validation_Type,
    Contact_Delete_Validation_Type,
    Contact_List_Query_Params_Model_Type,
    Contact_List_Query_Params_Type,
    Contact_Update_Validation_Type,
    Organization_Type,
    response_message,
    ULID_Type,
    User_Type,
} from "@repo/types";
import { ulid } from "ulid";
import { contact_error_message, general_error_message } from "../../../common/constants/error_message.constant";
import { Service_Response_Structure_Type } from "../../../common/constants/response_structure.constants";
import { Contact_Model } from "../model/contact.model";

const create = async (
    data: Contact_Create_Validation_Type,
    user: User_Type,
    organization: Organization_Type
): Promise<Service_Response_Structure_Type> => {
    const row = await Contact_Model.create({
        id: ulid(),
        display_name: data.display_name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        phone_country_code: data.phone_country_code ?? null,
        company_name: data.company_name ?? null,
        contact_type: data.contact_type,
        metadata: data.metadata ?? null,
        organization_id: organization.id,
        created_at: new Date(),
        updated_at: new Date(),
        created_by_id: user.id,
        updated_by_id: user.id,
    });

    if (!row) {
        return {
            code: general_error_message.database_connection_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.database_connection_error.message,
            error_type: general_error_message.database_connection_error.type,
            error_response: [{ message: general_error_message.database_connection_error.message, field: "contact", type: general_error_message.database_connection_error.type }],
        };
    }

    return {
        code: 201,
        status: response_message.enum.success,
        result: { contact: row },
    };
};

const update = async (
    data: Contact_Update_Validation_Type,
    user: User_Type,
    organization: Organization_Type
): Promise<Service_Response_Structure_Type> => {
    const existing = await Contact_Model.find_by_id(data.id);
    if (!existing) {
        return {
            code: contact_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: contact_error_message.not_found.message,
            error_type: contact_error_message.not_found.type,
            error_response: [{ message: contact_error_message.not_found.message, field: "id", type: contact_error_message.not_found.type }],
        };
    }
    if (existing.organization_id !== organization.id) {
        return {
            code: general_error_message.forbidden_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.forbidden_error.message,
            error_type: general_error_message.forbidden_error.type,
            error_response: [{ message: general_error_message.forbidden_error.message, field: "id", type: general_error_message.forbidden_error.type }],
        };
    }
    if (existing.version !== data.version) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{ message: general_error_message.update_conflict_error.message, field: "version", type: general_error_message.update_conflict_error.type }],
        };
    }

    const row = await Contact_Model.update({
        id: data.id,
        display_name: data.display_name,
        email: data.email,
        phone: data.phone,
        phone_country_code: data.phone_country_code,
        company_name: data.company_name,
        contact_type: data.contact_type,
        metadata: data.metadata,
        version: data.version,
        updated_at: new Date(),
        updated_by_id: user.id,
    });

    if (!row) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{ message: general_error_message.update_conflict_error.message, field: "version", type: general_error_message.update_conflict_error.type }],
        };
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: { contact: row },
    };
};

const find_by_id = async (
    id: ULID_Type,
    user: User_Type,
    organization: Organization_Type
): Promise<Service_Response_Structure_Type> => {
    const row = await Contact_Model.find_by_id(id);
    if (!row) {
        return {
            code: contact_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: contact_error_message.not_found.message,
            error_type: contact_error_message.not_found.type,
            error_response: [{ message: contact_error_message.not_found.message, field: "id", type: contact_error_message.not_found.type }],
        };
    }
    if (row.organization_id !== organization.id) {
        return {
            code: general_error_message.forbidden_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.forbidden_error.message,
            error_type: general_error_message.forbidden_error.type,
            error_response: [{ message: general_error_message.forbidden_error.message, field: "id", type: general_error_message.forbidden_error.type }],
        };
    }
    return {
        code: 200,
        status: response_message.enum.success,
        result: { contact: row },
    };
};

const get_all = async (
    query_params: Contact_List_Query_Params_Type,
    user: User_Type,
    organization: Organization_Type
): Promise<Service_Response_Structure_Type> => {
    const model: Contact_List_Query_Params_Model_Type = {
        ...query_params,
        organization_id: organization.id,
    };
    const rows = await Contact_Model.get_all(model, user);
    const total_count = query_params.is_search
        ? rows.length
        : rows.length > 0
            ? Number((rows[0] as unknown as { total_count: number }).total_count)
            : 0;
    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            contacts: rows,
            total_count,
            is_search: query_params.is_search,
        },
    };
};

const soft_delete_by_id = async (
    data: Contact_Delete_Validation_Type,
    user: User_Type,
    organization: Organization_Type
): Promise<Service_Response_Structure_Type> => {
    const existing = await Contact_Model.find_by_id(data.id);
    if (!existing) {
        return {
            code: contact_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: contact_error_message.not_found.message,
            error_type: contact_error_message.not_found.type,
            error_response: [{ message: contact_error_message.not_found.message, field: "id", type: contact_error_message.not_found.type }],
        };
    }
    if (existing.organization_id !== organization.id) {
        return {
            code: general_error_message.forbidden_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.forbidden_error.message,
            error_type: general_error_message.forbidden_error.type,
            error_response: [{ message: general_error_message.forbidden_error.message, field: "id", type: general_error_message.forbidden_error.type }],
        };
    }
    if (existing.version !== data.version) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{ message: general_error_message.update_conflict_error.message, field: "version", type: general_error_message.update_conflict_error.type }],
        };
    }

    const row = await Contact_Model.soft_delete_by_id(data.id, data.version, user);
    if (!row) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{ message: general_error_message.update_conflict_error.message, field: "version", type: general_error_message.update_conflict_error.type }],
        };
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: { contact: row },
    };
};

export const Contact_Service = {
    create,
    update,
    find_by_id,
    get_all,
    soft_delete_by_id,
};
