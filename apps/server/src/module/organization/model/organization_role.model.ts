import {
    Organization_Schema
} from "@repo/constants";
import {
    Organization_Role_Create_Type,
    Organization_Role_Delete_Type,
    Organization_Role_List_Query_Params_Model_Type,
    Organization_Role_Search_List_Item_Type,
    Organization_Role_Type,
    Organization_Role_Update_Type,
    ULID_Type
} from "@repo/types";
import { parse_order_by_helper } from "../../../common/helper_function/helper";
import {
    pool
} from "../../../config/database.config";


const create = async (
    data: Organization_Role_Create_Type, 
    return_only_query = false
): Promise<Organization_Role_Type | null | { query: string; values: any[] }> => {

    const query = `
        INSERT INTO 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Org_Role} (
                id,
                name,
                description,
                is_system_defined,
                organization_id,
                created_at,
                updated_at,
                created_by_id,
                updated_by_id
            ) VALUES (
               $1, 
               $2, 
               $3, 
               $4, 
               $5, 
               $6::TIMESTAMPTZ, 
               $7::TIMESTAMPTZ, 
               $8, 
               $9
            ) RETURNING *;
    `;

    const values = [
        data.id,
        data.name,
        data.description,
        data.is_system_defined,
        data.organization_id,
        data.created_at,
        data.updated_at,
        data.created_by_id,
        data.updated_by_id,
    ];

    if (return_only_query) {
        return { query, values };
    }

    const result = await pool.query<Organization_Role_Type>(query, values);
    return result.rows[0] ?? null;
};

const update = async (
    data: Organization_Role_Update_Type,
    return_only_query = false
): Promise<Organization_Role_Type | null | { query: string; values: any[] }> => {

    const update_query: string[] = [];
    const values: any[] = [data.id, data.version];
    let update_query_index = 3;

    if (data.name) {
        update_query.push(`name = $${update_query_index}`);
        update_query_index++;
        values.push(data.name);
    }

    if (data.description) {
        update_query.push(`description = $${update_query_index}`);
        update_query_index++;
        values.push(data.description);
    }

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.updated_at);

    if (data.updated_by_id) {
        update_query.push(`updated_by_id = $${update_query_index}`);
        update_query_index++;
        values.push(data.updated_by_id);
    }

    const query = `
        UPDATE 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Org_Role}
        SET
            ${update_query.join(", ")}
        WHERE
            id = $1
        AND
            version = $2
        RETURNING *;
    `;

    if (return_only_query) {
        return { query, values };
    }

    const result = await pool.query<Organization_Role_Type>(query, values);
    return result.rows[0] ?? null;
};

const find_by_id = async (
    id: ULID_Type
): Promise<Organization_Role_Type | null> => {
    const query = `
        SELECT 
            *
        FROM 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Org_Role}
        WHERE 
            id = $1;
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] ?? null;
};

const find_by_name_and_organization_id = async (
    name: string,
    organization_id: ULID_Type
): Promise<Organization_Role_Type | null> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Org_Role} 
        WHERE 
            name = $1
        AND
            organization_id = $2;
    `;
    const result = await pool.query<Organization_Role_Type>(query, [name, organization_id]);
    return result.rows[0] ?? null;
};

const get_all = async (
    search_params: Organization_Role_List_Query_Params_Model_Type,
): Promise<(Organization_Role_Type | Organization_Role_Search_List_Item_Type)[]> => {

    const filter_query: string[] = [`organization_id = $1`];
    const filter_value: any[] = [search_params.organization_id];

    let filter_query_index = 2;

    if (search_params.name) {
        filter_query.push(`name = $${filter_query_index}`);
        filter_value.push(search_params.name);
        filter_query_index++;
    }

    if (search_params.is_deleted === true) {
        filter_query.push(`is_deleted = true`);
    } else if (search_params.is_deleted === false) {
        filter_query.push(`is_deleted = false`);
    }

    let order_by_query = "";
    if(search_params.order_by) {
        order_by_query = `ORDER BY ${parse_order_by_helper(
            search_params.order_by,
            "organization_role"
        )}`;
    }

    let pagination_query = "";

    if (search_params.is_search == false && search_params.page_number && search_params.page_size) {
        pagination_query = ` OFFSET $${filter_query_index} LIMIT $${filter_query_index + 1}`;
        filter_value.push((search_params.page_number - 1) * search_params.page_size);
        filter_value.push(search_params.page_size);
        filter_query_index += 2;
    }

    let select_query = "";
    if (search_params.is_search) {
        select_query = `
            id,
            name
        `;
    } else {
        select_query = `
            *,
            created_at AT TIME ZONE $1::varchar AS created_at,
            updated_at AT TIME ZONE $1::varchar AS updated_at,
            COUNT(*) OVER()::INTEGER AS total_count
        `;
    }

    const query = `
        SELECT 
           ${select_query}
        FROM
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Org_Role} AS organization_role
            ${filter_query.length > 0 ? `WHERE ${filter_query.join(" AND ")}` : ""}
            ${order_by_query}
            ${pagination_query}
    `;
    const result = await pool.query<Organization_Role_Type | Organization_Role_Search_List_Item_Type>(query, filter_value);
    return result.rows;
};

const soft_delete_by_id = async (
    data: Organization_Role_Delete_Type,
    return_only_query = false
): Promise<Organization_Role_Type | null | { query: string; values: any[] }> => {

    const update_query: string[] = [];
    const values: any[] = [data.id, data.version];
    let update_query_index = 3;

    update_query.push(`is_deleted = true`);

    update_query.push(`deleted_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.deleted_at);

    if (data.deleted_by_id) {
        update_query.push(`deleted_by_id = $${update_query_index}`);
        update_query_index++;
        values.push(data.deleted_by_id);
    }

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.updated_at);

    if (data.updated_by_id) {
        update_query.push(`updated_by_id = $${update_query_index}`);
        update_query_index++;
        values.push(data.updated_by_id);
    }
    
    const query = `
        UPDATE 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Org_Role}
        SET
            ${update_query.join(", ")}
        WHERE
            id = $1
        AND
            version = $2
        RETURNING *;
    `;

    if (return_only_query) {
        return { query, values };
    }

    const result = await pool.query<Organization_Role_Type>(query, values);
    return result.rows[0] ?? null;
};

export const Organization_Role_Model = {
    create,
    update,
    find_by_id,
    find_by_name_and_organization_id,
    get_all,
    soft_delete_by_id
};