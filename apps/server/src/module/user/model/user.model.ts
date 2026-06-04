import { default_timezone, User_Schema } from "@repo/constants";
import {
    Organization_Create_Type,
    Organization_Role_Create_Type,
    Organization_Role_Type,
    Organization_Type,
    ULID_Type,
    User_Asset_Signup_Create_Type,
    User_Create_Type,
    User_List_Query_Params_Type,
    User_Search_List_Item_Type,
    User_Signup_Create_Body_Type,
    User_Soft_Delete_Type,
    User_Type,
    User_Update_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { ulid } from "ulid";
import { DatabaseConnectionError } from "../../../common/errors/database-connection-error";
import { parse_order_by_helper } from "../../../common/helper_function/helper";
import { pgpPool, pool } from "../../../config/database.config";
import { Organization_Model } from "../../organization/model/organization.model";
import { Organization_Role_Model } from "../../organization/model/organization_role.model";
import { User_Asset_Model } from "./user_asset.model";

const OWNER_ROLE_NAME = "owner";

const create_user_transaction = async (
    organization_create_data: Organization_Create_Type,
    user_body: User_Signup_Create_Body_Type,
    user_asset_body: User_Asset_Signup_Create_Type
): Promise<{
    user: User_Type,
    organization: Organization_Type,
    organization_role: Organization_Role_Type
}> => {
    try {
        return await pgpPool.tx(async (t) => {
            const organization_create_query = await Organization_Model.create(
                organization_create_data,
                true
            ) as { query: string; values: any[] };

            const organization_create_result = await t.query(
                organization_create_query.query,
                organization_create_query.values
            );

            const organization = organization_create_result[0] as Organization_Type;

            const owner_role_id = ulid();
            const role_create: Organization_Role_Create_Type = {
                id: owner_role_id,
                name: OWNER_ROLE_NAME,
                description: "Organization owner",
                is_system_defined: true,
                organization_id: organization.id,
                created_at: new Date(),
                updated_at: new Date(),
                created_by_id: null,
                updated_by_id: null,
            };

            const organization_role_create_query = await Organization_Role_Model.create(
                role_create,
                true
            ) as { query: string; values: any[] };

            const organization_role_create_result = await t.query(
                organization_role_create_query.query,
                organization_role_create_query.values
            );

            const organization_role = organization_role_create_result[0] as Organization_Role_Type;

            const user_create_data: User_Create_Type = {
                ...user_body,
                organization_id: organization.id,
                role_id: owner_role_id,
                role_name: OWNER_ROLE_NAME,
                is_primary_user: true,
            };

            const user_create_query = await create(
                user_create_data,
                true
            ) as { query: string; values: any[] };

            const user_create_result = await t.query(
                user_create_query.query,
                user_create_query.values
            );

            const user_row = user_create_result[0] as User_Type;

            const user_asset_create_query = await User_Asset_Model.create(
                {
                    ...user_asset_body,
                    organization_id: organization.id,
                },
                user_row,
                true
            ) as { query: string; values: any[] };

            await t.query(
                user_asset_create_query.query,
                user_asset_create_query.values
            );

            return {
                user: user_row,
                organization,
                organization_role,
            };
        });
    } catch (error: any) {
        console.error("Transaction failed:", error);
        throw new DatabaseConnectionError(error.message);
    }
};

const create = (
    data: User_Create_Type,
    return_only_query = false
): Promise<QueryResult<User_Type>> | { query: string; values: any[] } => {

    const { timezone = default_timezone } = data;

    const query = `
        INSERT INTO ${User_Schema.SCHEMA}.${User_Schema.User} (
            "id",
            "organization_id",
            "first_name",
            "last_name",
            "full_name",
            "username",
            "email",
            "phone",
            "phone_country_code",
            "password",
            "identity_provider",
            "identity_provider_user_id",
            "is_active",
            "last_login_at",
            "timezone",
            "is_deleted",
            "deleted_at",
            "deleted_by_id",
            "version",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
            "role_id",
            "role_name",
            "is_primary_user"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
            $20::TIMESTAMPTZ,
            $21::TIMESTAMPTZ,
            $22, $23, $24, $25, $26
        ) RETURNING *;
    `;

    const values = [
        data.id,
        data.organization_id,
        data.first_name,
        data.last_name,
        data.full_name,
        data.username,
        data.email,
        data.phone,
        data.phone_country_code,
        data.password,
        data.identity_provider,
        data.identity_provider_user_id ?? null,
        true,
        null,
        timezone,
        false,
        null,
        null,
        1,
        data.created_at,
        data.updated_at,
        data.created_by_id ?? null,
        data.updated_by_id ?? null,
        data.role_id,
        data.role_name,
        data.is_primary_user,
    ];

    if (return_only_query) {
        return { query, values };
    }

    return pool.query(query, values);
};

const update = (
    data: User_Update_Type,
    return_only_query = false
): Promise<QueryResult<User_Type>> | { query: string; values: any[] } => {
    const update_query: string[] = [];
    const values: any[] = [data.id];
    let update_query_index = 2;

    if (data.first_name) {
        update_query.push(`first_name = $${update_query_index}`);
        update_query_index++;
        values.push(data.first_name);
    }

    if (data.last_name) {
        update_query.push(`last_name = $${update_query_index}`);
        update_query_index++;
        values.push(data.last_name);
    }

    if (data.full_name) {
        update_query.push(`full_name = $${update_query_index}`);
        update_query_index++;
        values.push(data.full_name);
    }

    if (data.timezone) {
        update_query.push(`timezone = $${update_query_index}`);
        update_query_index++;
        values.push(data.timezone);
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
            ${User_Schema.SCHEMA}.${User_Schema.User}
        SET
            ${update_query.join(", ")}
        WHERE
            id = $1
        RETURNING *;
    `;

    if (return_only_query) {
        return { query, values };
    }

    return pool.query(query, values);
};

const delete_by_id = (
    id: ULID_Type,
    return_only_query = false
): Promise<QueryResult<User_Type>> | { query: string; values: any[] } => {
    const query = `
        DELETE FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        WHERE 
            id = $1
        RETURNING *;
    `;

    const values = [id];

    if (return_only_query) {
        return { query, values };
    }

    return pool.query(query, values);
};

const soft_delete_by_id = (
    data: User_Soft_Delete_Type,
    return_only_query = false
): Promise<QueryResult<User_Type>> | { query: string; values: any[] } => {
    const update_query: string[] = [];
    const values: any[] = [data.id];
    let update_query_index = 2;

    update_query.push(`is_deleted = true`);

    update_query.push(`deleted_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.deleted_at);

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.updated_at);

    update_query.push(`updated_by_id = $${update_query_index}`);
    update_query_index++;
    values.push(data.updated_by_id);

    const query = `
        UPDATE
            ${User_Schema.SCHEMA}.${User_Schema.User}
        SET
            ${update_query.join(", ")}
        WHERE
            id = $1
        RETURNING *;
    `;

    if (return_only_query) {
        return { query, values };
    }

    return pool.query(query, values);
};

const find_by_id = (
    id: ULID_Type
): Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            *
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        WHERE 
            id = $1;
    `;

    return pool.query(query, [id]);
};

const find_by_username_phone_or_email = (
    phone?: string | null,
    email?: string | null,
    username?: string | null,
): Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        WHERE 
            phone = $1 
        OR 
            email = $2
        OR 
            username = $3;
    `;

    return pool.query(query, [phone, email, username]);
};

const find_for_signin = (
    username: string
): Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        WHERE 
            username = $1
                OR
            email = $1
                OR
            phone = $1;
    `;

    return pool.query(query, [username]);
};

const find_by_id_list = (
    id_list: ULID_Type[],
    user: User_Type
): Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            *,
            created_at AT TIME ZONE $1::varchar AS created_at,
            updated_at AT TIME ZONE $1::varchar AS updated_at
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        WHERE 
            id = ANY($2::ulid[]);
    `;
    return pool.query(query, [user.timezone, id_list]);
};

const get_all = (
    search_params: User_List_Query_Params_Type,
    user: User_Type
): Promise<QueryResult<User_Type | User_Search_List_Item_Type>> => {

    const filter_query: string[] = [];
    const filter_value: any[] = search_params.is_search ? [] : [user.timezone];
    let where_query_index = search_params.is_search ? 1 : 2;

    filter_query.push(`u.organization_id = $${where_query_index}`);
    filter_value.push(user.organization_id);
    where_query_index++;

    if (search_params.first_name) {
        filter_query.push(`u.first_name = $${where_query_index++}`);
        filter_value.push(search_params.first_name);
    }

    if (search_params.last_name) {
        filter_query.push(`u.last_name = $${where_query_index++}`);
        filter_value.push(search_params.last_name);
    }

    if (search_params.username) {
        filter_query.push(`u.username = $${where_query_index++}`);
        filter_value.push(search_params.username);
    }

    if (search_params.email) {
        filter_query.push(`u.email = $${where_query_index++}`);
        filter_value.push(search_params.email);
    }

    if (search_params.phone) {
        filter_query.push(`u.phone = $${where_query_index++}`);
        filter_value.push(search_params.phone);
    }

    if (search_params.phone_country_code) {
        filter_query.push(`u.phone_country_code = $${where_query_index++}`);
        filter_value.push(search_params.phone_country_code);
    }

    if (search_params.is_active === true) {
        filter_query.push(`u.is_active = true`);
    } else if (search_params.is_active === false) {
        filter_query.push(`u.is_active = false`);
    }

    let order_by_query = "";
    if (search_params.order_by) {
        order_by_query = `ORDER BY ${parse_order_by_helper(search_params.order_by, "u")}`;
    }

    let pagination_query = "";

    if (search_params.is_search == false && search_params.page_number && search_params.page_size) {
        pagination_query = ` OFFSET $${where_query_index} LIMIT $${where_query_index + 1}`;
        filter_value.push((search_params.page_number - 1) * search_params.page_size);
        filter_value.push(search_params.page_size);
        where_query_index += 2;
    }

    let select_query = "";
    if (search_params.is_search) {
        select_query = `
            id,
            organization_id,
            role_name,
            first_name,
            last_name,
            full_name,
            username,
            email,
            phone,
            phone_country_code,
            is_active,
            timezone
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
            ${User_Schema.SCHEMA}.${User_Schema.User} AS u
            ${filter_query.length > 0 ? `WHERE ${filter_query.join(" AND ")}` : ""}
            ${order_by_query}
            ${pagination_query}
    `;
    return pool.query(query, filter_value);
};

const find_by_email = (
    email: string
): Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User}
        WHERE 
            email = $1;
    `;
    return pool.query(query, [email]);
};

const find_by_phone_and_phone_country_code = (
    phone: string,
    phone_country_code: string
): Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        WHERE 
            phone = $1
        AND
            phone_country_code = $2;
    `;

    return pool.query(query, [phone, phone_country_code]);
};

const update_password_to_null_by_user_id = (
    user_id: ULID_Type,
    user: User_Type,
    return_only_query = false
): Promise<QueryResult<User_Type>> | { query: string; values: any[] } => {
    const query = `
        UPDATE 
            ${User_Schema.SCHEMA}.${User_Schema.User} 
        SET 
            password = NULL,
            version = version + 1,
            updated_at = $2::TIMESTAMPTZ,
            updated_by_id = $3
        WHERE id = $1
        RETURNING *;
    `;

    const values = [user_id, new Date(), user.id];

    if (return_only_query) {
        return { query, values };
    }

    return pool.query(query, values);
};

export const User_Model = {
    create_user_transaction,
    create,
    update,
    delete_by_id,
    soft_delete_by_id,
    find_by_id,
    find_by_username_phone_or_email,
    find_for_signin,
    find_by_id_list,
    get_all,
    find_by_email,
    find_by_phone_and_phone_country_code,
    update_password_to_null_by_user_id
};
