import { Contact_Schema } from "@repo/constants";
import {
    Contact_Create_Type,
    Contact_List_Query_Params_Model_Type,
    Contact_Search_List_Item_Type,
    Contact_Type,
    Contact_Update_Type,
    ULID_Type,
    User_Type
} from "@repo/types";
import { parse_order_by_helper } from "../../../common/helper_function/helper";
import { pool } from "../../../config/database.config";

const create = async (
    data: Contact_Create_Type,
    return_only_query = false
): Promise<Contact_Type | null | { query: string; values: unknown[] }> => {
    const query = `
        INSERT INTO ${Contact_Schema.SCHEMA}.${Contact_Schema.Contact} (
            id,
            display_name,
            email,
            phone,
            phone_country_code,
            company_name,
            contact_type,
            metadata,
            organization_id,
            is_deleted,
            deleted_at,
            deleted_by_id,
            version,
            created_by_id,
            updated_by_id,
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9,
            $10, $11, $12, $13, $14, $15,
            $16::TIMESTAMPTZ,
            $17::TIMESTAMPTZ
        ) RETURNING *;
    `;

    const values = [
        data.id,
        data.display_name,
        data.email ?? null,
        data.phone ?? null,
        data.phone_country_code ?? null,
        data.company_name ?? null,
        data.contact_type,
        data.metadata ?? null,
        data.organization_id,
        false,
        null,
        null,
        1,
        data.created_by_id ?? null,
        data.updated_by_id ?? null,
        data.created_at,
        data.updated_at,
    ];

    if (return_only_query) {
        return { query, values };
    }

    const result = await pool.query<Contact_Type>(query, values);
    return result.rows[0] ?? null;
};

const update = async (
    data: Contact_Update_Type,
    return_only_query = false
): Promise<Contact_Type | null | { query: string; values: unknown[] }> => {
    const update_query: string[] = [];
    const values: unknown[] = [data.id, data.version];
    let i = 3;

    if (data.display_name !== undefined) {
        update_query.push(`display_name = $${i}`);
        values.push(data.display_name);
        i++;
    }
    if (data.email !== undefined) {
        update_query.push(`email = $${i}`);
        values.push(data.email);
        i++;
    }
    if (data.phone !== undefined) {
        update_query.push(`phone = $${i}`);
        values.push(data.phone);
        i++;
    }
    if (data.phone_country_code !== undefined) {
        update_query.push(`phone_country_code = $${i}`);
        values.push(data.phone_country_code);
        i++;
    }
    if (data.company_name !== undefined) {
        update_query.push(`company_name = $${i}`);
        values.push(data.company_name);
        i++;
    }
    if (data.contact_type !== undefined) {
        update_query.push(`contact_type = $${i}`);
        values.push(data.contact_type);
        i++;
    }
    if (data.metadata !== undefined) {
        update_query.push(`metadata = $${i}::jsonb`);
        values.push(data.metadata);
        i++;
    }

    update_query.push(`version = version + 1`);
    update_query.push(`updated_at = $${i}::TIMESTAMPTZ`);
    values.push(data.updated_at);
    i++;

    if (data.updated_by_id) {
        update_query.push(`updated_by_id = $${i}`);
        values.push(data.updated_by_id);
    }

    const query = `
        UPDATE ${Contact_Schema.SCHEMA}.${Contact_Schema.Contact}
        SET ${update_query.join(", ")}
        WHERE id = $1 AND version = $2
        RETURNING *;
    `;

    if (return_only_query) {
        return { query, values };
    }

    const result = await pool.query<Contact_Type>(query, values);
    return result.rows[0] ?? null;
};

const find_by_id = async (id: ULID_Type): Promise<Contact_Type | null> => {
    const result = await pool.query<Contact_Type>(
        `SELECT * FROM ${Contact_Schema.SCHEMA}.${Contact_Schema.Contact} WHERE id = $1`,
        [id]
    );
    return result.rows[0] ?? null;
};

const soft_delete_by_id = async (
    id: ULID_Type,
    version: number,
    user: User_Type,
    return_only_query = false
): Promise<Contact_Type | null | { query: string; values: unknown[] }> => {
    const now = new Date();
    const query = `
        UPDATE ${Contact_Schema.SCHEMA}.${Contact_Schema.Contact}
        SET is_deleted = TRUE,
            deleted_at = $3::TIMESTAMPTZ,
            deleted_by_id = $4,
            version = version + 1,
            updated_at = $3::TIMESTAMPTZ,
            updated_by_id = $4
        WHERE id = $1 AND version = $2
        RETURNING *;
    `;
    const values = [id, version, now, user.id];

    if (return_only_query) {
        return { query, values };
    }

    const result = await pool.query<Contact_Type>(query, values);
    return result.rows[0] ?? null;
};

const get_all = async (
    search_params: Contact_List_Query_Params_Model_Type,
    _user: User_Type
): Promise<(Contact_Type | Contact_Search_List_Item_Type)[]> => {
    const filter_query: string[] = [`organization_id = $1`, `is_deleted = FALSE`];
    const filter_value: unknown[] = [search_params.organization_id];
    let filter_query_index = 2;

    if (search_params.display_name) {
        filter_query.push(`display_name ILIKE $${filter_query_index}`);
        filter_value.push(`%${search_params.display_name}%`);
        filter_query_index++;
    }
    if (search_params.email) {
        filter_query.push(`lower(email) = lower($${filter_query_index})`);
        filter_value.push(search_params.email);
        filter_query_index++;
    }
    if (search_params.contact_type) {
        filter_query.push(`contact_type = $${filter_query_index}`);
        filter_value.push(search_params.contact_type);
        filter_query_index++;
    }

    let order_by_query = "";
    if (search_params.order_by) {
        order_by_query = `ORDER BY ${parse_order_by_helper(search_params.order_by, "c")}`;
    }

    let pagination_query = "";
    if (search_params.is_search === false && search_params.page_number && search_params.page_size) {
        pagination_query = ` OFFSET $${filter_query_index} LIMIT $${filter_query_index + 1}`;
        filter_value.push((search_params.page_number - 1) * search_params.page_size);
        filter_value.push(search_params.page_size);
    }

    const select_query = search_params.is_search
        ? `id, display_name, email, contact_type`
        : `*, COUNT(*) OVER()::INTEGER AS total_count`;

    const query = `
        SELECT ${select_query}
        FROM ${Contact_Schema.SCHEMA}.${Contact_Schema.Contact} AS c
        WHERE ${filter_query.join(" AND ")}
        ${order_by_query}
        ${pagination_query}
    `;

    const result = await pool.query<Contact_Type | Contact_Search_List_Item_Type>(query, filter_value);
    return result.rows;
};

export const Contact_Model = {
    create,
    update,
    find_by_id,
    soft_delete_by_id,
    get_all,
};
