import { User_Schema } from "@repo/constants";
import {
    User_Asset_Create_Type,
    User_Asset_Type,
    User_Asset_Update_Type,
    User_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { pool } from "../../../config/database.config";

const create = (
    data: User_Asset_Create_Type,
    user: User_Type,
    return_only_query = false
) => {

    const query = `
        INSERT INTO
            ${User_Schema.SCHEMA}.${User_Schema.User_Asset}
        (
            user_id,
            organization_id,
            profile_picture_provider,
            profile_picture_path,
            profile_picture_url,
            is_deleted,
            deleted_at,
            deleted_by_id,
            version,
            created_by_id,
            updated_by_id,
            created_at,
            updated_at
        )
        VALUES
        (
            $1,
            $2,
            $3,
            $4,
            $5,
            FALSE,
            NULL,
            NULL,
            1,
            NULL,
            NULL,
            $6::TIMESTAMPTZ,
            $7::TIMESTAMPTZ
        )
        RETURNING *;
    `;

    const values = [
        data.user_id,
        data.organization_id,
        data.profile_picture_provider,
        data.profile_picture_path,
        data.profile_picture_url,
        data.created_at,
        data.updated_at
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
    data: User_Asset_Update_Type,
    user: User_Type,
    return_only_query = false
) => {
    const update_query: string[] = [];
    const values: any[] = [data.user_id];
    let update_query_index = 2;

    if (data.profile_picture_provider) {
        update_query.push(`profile_picture_provider = $${update_query_index}`);
        update_query_index++;
        values.push(data.profile_picture_provider);
    }

    if (data.profile_picture_path) {
        update_query.push(`profile_picture_path = $${update_query_index}`);
        update_query_index++;
        values.push(data.profile_picture_path);
    }

    if (data.profile_picture_url) {
        update_query.push(`profile_picture_url = $${update_query_index}`);
        update_query_index++;
        values.push(data.profile_picture_url);
    }

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;

    values.push(data.updated_at);

    const query = `
        UPDATE
            ${User_Schema.SCHEMA}.${User_Schema.User_Asset}
        SET
            ${update_query.join(", ")}
        WHERE
            user_id = $1
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

const find_by_user_id = (
    user_id: string
): Promise<QueryResult<User_Asset_Type>> => {
    const query = `
        SELECT 
            *
        FROM 
            ${User_Schema.SCHEMA}.${User_Schema.User_Asset}
        WHERE 
            user_id = $1;
    `;

    return pool.query(query, [user_id]);
};

export const User_Asset_Model = {
    create,
    update,
    find_by_user_id,
};
