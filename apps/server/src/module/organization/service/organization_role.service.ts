import {
    Organization_Role_Create_Type,
    Organization_Role_Create_Validation_Type,
    Organization_Role_Delete_Type,
    Organization_Role_Delete_Validation_Type,
    organization_role_field_enum_doc,
    Organization_Role_List_Query_Params_Model_Type,
    Organization_Role_List_Query_Params_Type,
    Organization_Role_Update_Type,
    Organization_Role_Update_Validation_Type,
    Organization_Type,
    response_message,
    ULID_Type,
    User_Type
} from "@repo/types";
import { ulid } from "ulid";
import { general_error_message, organization_role_error_message } from "../../../common/constants/error_message.constant";
import {
    Service_Response_Structure_Type
} from "../../../common/constants/response_structure.constants";
import { Organization_Role_Model } from "../model/organization_role.model";



const create = async (
    data: Organization_Role_Create_Validation_Type,
    user: User_Type,
    organization : Organization_Type
): Promise<Service_Response_Structure_Type> => {


    const role_name = data.name.trim().toLowerCase();

   //First we will make sure that the given role name is not already taken
   const check_role_name = await Organization_Role_Model.find_by_name_and_organization_id(
    role_name,
    organization.id
   );

    if (check_role_name !== null) {
        return {
            code: organization_role_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: organization_role_error_message.not_found.message,
            error_type: organization_role_error_message.not_found.type,
            error_response: [{
                message: organization_role_error_message.not_found.message,
                field: organization_role_field_enum_doc.enum.name,
                type: organization_role_error_message.not_found.type
            }]
        }
    }

    //If the given role name is available, we will create the role
    const organization_role_create_data: Organization_Role_Create_Type = {
        id: ulid().toString(),
        name: role_name,
        description: data.description,
        is_system_defined: false,
        organization_id: organization.id,
        created_at: new Date(),
        updated_at: new Date(),
        created_by_id: user.id,
        updated_by_id: user.id,
    }

    const create_result = await Organization_Role_Model.create(
        organization_role_create_data,
        false
    );

    return {
        code: 201,
        status: response_message.enum.success,
        result: {
            organization_role: create_result
        }
    }
};

const update = async (
    data: Organization_Role_Update_Validation_Type,
    user: User_Type,
    organization : Organization_Type
): Promise<Service_Response_Structure_Type> => {


    //First we will make sure the given role id is valid
    const check_role_id = await Organization_Role_Model.find_by_id(
        data.id
    );

    if (check_role_id === null) {
        return {
            code: organization_role_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: organization_role_error_message.not_found.message,
            error_type: organization_role_error_message.not_found.type,
            error_response: [{
                message: organization_role_error_message.not_found.message,
                field: organization_role_field_enum_doc.enum.id,
                type: organization_role_error_message.not_found.type
            }]
        }
    }

    //If the given role id is valid, then we need to make sure the role id belongs to the user's organization
    if(check_role_id.organization_id !== organization.id) {
        return {
            code: general_error_message.forbidden_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.forbidden_error.message,
            error_type: general_error_message.forbidden_error.type,
            error_response: [{
                message: general_error_message.forbidden_error.message,
                field: organization_role_field_enum_doc.enum.id,
                type: general_error_message.forbidden_error.type
            }]
        }
    }

    //After validation, we will make sure the given version is valid
    if(check_role_id.version !== data.version) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{
                message: general_error_message.update_conflict_error.message,
                field: organization_role_field_enum_doc.enum.version,
                type: general_error_message.update_conflict_error.type
            }]
        }
    }

    //Once we have validated the version, we will check if the given name has changed

    if(data.name && data.name !== check_role_id.name) {
        //If the given name has changed, we will make sure that the given role name is not already taken

        data.name = data.name.trim().toLowerCase();

        const check_role_name = await Organization_Role_Model.find_by_name_and_organization_id(
            data.name,
            organization.id
        );

        if(check_role_name !== null) {
            return {
                code: organization_role_error_message.not_found.code,
                status: response_message.enum.error,
                error_message: organization_role_error_message.not_found.message,
                error_type: organization_role_error_message.not_found.type,
                error_response: [{
                    message: organization_role_error_message.not_found.message,
                    field: organization_role_field_enum_doc.enum.name,
                    type: organization_role_error_message.not_found.type
                }]
            }
        }
    }

    const organization_role_update_data: Organization_Role_Update_Type = {
        id: data.id,
        name: data.name,
        description: data.description,
        version: check_role_id.version + 1,
        updated_at: new Date(),
        updated_by_id: user.id,
    }

    const update_result = await Organization_Role_Model.update(
        organization_role_update_data,
        false
    );

    //make sure the update was successful
    if(update_result === null) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{
                message: general_error_message.update_conflict_error.message,
                field: organization_role_field_enum_doc.enum.version,   
                type: general_error_message.update_conflict_error.type
            }]
        }
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            organization_role: update_result
        }
    }
};

const find_by_id = async (
    id: ULID_Type,
    user: User_Type,
    organization : Organization_Type
): Promise<Service_Response_Structure_Type> => {
   
    //Check if the given role id is valid
    const check_role_id = await Organization_Role_Model.find_by_id(
        id
    );

    if(check_role_id === null) {
        return {
            code: organization_role_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: organization_role_error_message.not_found.message,
            error_type: organization_role_error_message.not_found.type,
            error_response: [{
                message: organization_role_error_message.not_found.message,
                field: organization_role_field_enum_doc.enum.id,
                type: organization_role_error_message.not_found.type
            }]
        }
    }

    //If the given role id is valid, then we need to make sure the role id belongs to the user's organization
    if(check_role_id.organization_id !== organization.id) {
        return {
            code: general_error_message.forbidden_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.forbidden_error.message,
            error_type: general_error_message.forbidden_error.type,
            error_response: [{
                message: general_error_message.forbidden_error.message,
                field: organization_role_field_enum_doc.enum.id,
                type: general_error_message.forbidden_error.type
            }]
        }
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            organization_role: check_role_id
        }
    }
};

const get_all = async (
    query_params: Organization_Role_List_Query_Params_Type,
    user: User_Type,
    organization : Organization_Type
): Promise<Service_Response_Structure_Type> => {

    const organization_role_list_query_params_model: Organization_Role_List_Query_Params_Model_Type = {
        ...query_params,
        organization_id: organization.id
    };

    //Get all the roles for the user's organization
    const roles = await Organization_Role_Model.get_all(
        organization_role_list_query_params_model
    );

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            organization_roles: roles,
            total_count: query_params.is_search ? roles.length : (roles[0] as any).total_count,
            is_search: query_params.is_search
        }
    }
};

const soft_delete_by_id = async (
    data: Organization_Role_Delete_Validation_Type,
    user: User_Type,
    organization : Organization_Type
): Promise<Service_Response_Structure_Type> => {
 
    //First we will make sure the given role id is valid
    const check_role_id = await Organization_Role_Model.find_by_id(
        data.id
    );

    if(check_role_id === null) {
        return {
            code: organization_role_error_message.not_found.code,
            status: response_message.enum.error,
            error_message: organization_role_error_message.not_found.message,
            error_type: organization_role_error_message.not_found.type,
            error_response: [{
                message: organization_role_error_message.not_found.message,
                field: organization_role_field_enum_doc.enum.id,
                type: organization_role_error_message.not_found.type
            }]
        }
    }
    
    //If the given role id is valid, then we need to make sure the role id belongs to the user's organization
    if(check_role_id.organization_id !== organization.id) {
        return {
            code: general_error_message.forbidden_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.forbidden_error.message,
            error_type: general_error_message.forbidden_error.type,
            error_response: [{
                message: general_error_message.forbidden_error.message,
                field: organization_role_field_enum_doc.enum.id,
                type: general_error_message.forbidden_error.type
            }]
        }
    }
    
    
    //After validation, we will make sure the given version is valid
    if(check_role_id.version !== data.version) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{
                message: general_error_message.update_conflict_error.message,
                field: organization_role_field_enum_doc.enum.version,
                type: general_error_message.update_conflict_error.type
            }]
        }
    }
    
    //Now we will soft delete the role
    const soft_delete_data : Organization_Role_Delete_Type = {
        id: data.id,
        version: check_role_id.version + 1,
        deleted_at: new Date(),
        deleted_by_id: user.id,
        is_deleted: true,
        updated_at: new Date(),
        updated_by_id: user.id,
    }

    const soft_delete_result = await Organization_Role_Model.soft_delete_by_id(
        soft_delete_data,
        false
    );

    if(soft_delete_result === null) {
        return {
            code: general_error_message.update_conflict_error.code,
            status: response_message.enum.error,
            error_message: general_error_message.update_conflict_error.message,
            error_type: general_error_message.update_conflict_error.type,
            error_response: [{
                message: general_error_message.update_conflict_error.message,
                field: organization_role_field_enum_doc.enum.version,
                type: general_error_message.update_conflict_error.type
            }]
        }
    }

    return {
        code: 200,
        status: response_message.enum.success,
        result: {
            organization_role: soft_delete_result
        }
    }

}

export const Organization_Role_Service = {
    create,
    update,
    find_by_id,
    get_all,
    soft_delete_by_id
};
