import {
    default_timezone,
    Organization_Schema
} from "@repo/constants";
import {
    Organization_Create_Type,
    Organization_Type,
    Organization_Update_Type,
    ULID_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { DatabaseConnectionError } from "../../../common/errors/database-connection-error";
import {
    pgpPool,
    pool
} from "../../../config/database.config";


const create_transaction = async (
    organization_create_data: Organization_Create_Type,
) : Promise<{ organization: Organization_Type }> => {
    try {
        const return_value: {
            organization: Organization_Type
        } = await pgpPool.tx(async (t) => {

            const organization_create_query = await create(
                organization_create_data, 
                true
            ) as {
                query: string;
                values: any[];
            };

            const organization_create_result = await t.query(
                organization_create_query.query,
                organization_create_query.values
            );

            return {
                organization: organization_create_result[0] as Organization_Type
            }
        });
        return return_value;
    } catch (error: any) {
        throw new DatabaseConnectionError(error.message);
    }
};

const create = (
    data: Organization_Create_Type, 
    return_only_query = false
) : Promise<QueryResult<Organization_Type>> | { query: string; values: any[] } => {

    const { timezone = default_timezone } = data;

    const query = `
        INSERT INTO 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Organization} (
                id,
                name,
                description,
                website,
                logo,
                email,
                phone,
                phone_country_code,
                timezone,
                created_at,
                updated_at
            ) VALUES (
                $1, 
                $2, 
                $3, 
                $4, 
                $5, 
                $6, 
                $7, 
                $8, 
                $9,
                $10::TIMESTAMPTZ,
                $11::TIMESTAMPTZ
            ) RETURNING *;
    `;

    const values = [
        data.id,
        data.name,
        data.description,
        data.website,
        data.logo,
        data.email,
        data.phone,
        data.phone_country_code,
        timezone,
        data.created_at,
        data.updated_at,
    ];

    if (return_only_query) {
        return {
            query,
            values,
        };
    }

    return pool.query(query, values);
};

const update = (
    data: Organization_Update_Type,
    return_only_query = false
) : Promise<QueryResult<Organization_Type>> | { query: string; values: any[] } => {

    const update_query: string[] = [];
    const values: any[] = [data.id];
    let update_query_index = 2;

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

    if (data.website) {
        update_query.push(`website = $${update_query_index}`);
        update_query_index++;
        values.push(data.website);
    }

    if (data.logo) {
        update_query.push(`logo = $${update_query_index}`);
        update_query_index++;
        values.push(data.logo);
    }

    if (data.email) {
        update_query.push(`email = $${update_query_index}`);
        update_query_index++;
        values.push(data.email);
    }

    if (data.phone) {
        update_query.push(`phone = $${update_query_index}`);
        update_query_index++;
        values.push(data.phone);
    }

    if (data.phone_country_code) {
        update_query.push(`phone_country_code = $${update_query_index}`);
        update_query_index++;
        values.push(data.phone_country_code);
    }

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.updated_at);

    const query = `
        UPDATE 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Organization}
        SET
            ${update_query.join(", ")}
        WHERE
            id = $1
        RETURNING *;
    `;

    if (return_only_query) {
        return {
            query,
            values,
        };
    }

    return pool.query(query, values);
};

const find_by_id = (
    id: ULID_Type
): Promise<QueryResult<Organization_Type>> => {
    const query = `
        SELECT 
            *
        FROM 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Organization}
        WHERE 
            id = $1;
    `;

    return pool.query(query, [id]);
};

const find_by_name = (
    name: string
): Promise<QueryResult<Organization_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Organization} 
        WHERE 
            name = $1;
    `;
    return pool.query(query, [name]);

};

const get_all = (): Promise<QueryResult<Organization_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${Organization_Schema.SCHEMA}.${Organization_Schema.Organization};
    `;
    return pool.query(query);
};

export const Organization_Model = {
    create_transaction,
    create,
    update,
    find_by_id,
    find_by_name,
    get_all
};