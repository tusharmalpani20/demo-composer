import { Auth_Schema, User_Schema } from "@repo/constants";
import {
    Auth_Session_Create_Type,
    Auth_Session_Type,
    Auth_Session_Update_Organization_Id_Type,
    ULID_Type,
    User_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { pool } from "../../../config/database.config";


const create = (
    data: Auth_Session_Create_Type, 
    return_only_query = false
) : Promise<QueryResult<Auth_Session_Type>> | { query: string; values: any[] } => {

    const query = `
        INSERT INTO ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session} (
            "id",
            "user_id",
            "organization_id",
            "identity_provider",
            "identity_provider_session_id",
            "jwt_token",
            "ip_address",
            "user_agent",
            "expires_at",
            "is_session_active",
            "last_active_at",
            "created_at",
            "updated_at"
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
            $10,
            $11,
            $12::TIMESTAMPTZ,
            $13::TIMESTAMPTZ
        ) RETURNING *;
    `;

    const values = [
        data.id,
        data.user_id,
        data.organization_id,
        data.identity_provider,
        data.identity_provider_session_id,
        data.jwt_token,
        data.ip_address,
        data.user_agent,
        data.expires_at,
        data.is_session_active,
        data.last_active_at,
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

const find_by_id = (
    id: ULID_Type
): Promise<QueryResult<Auth_Session_Type>> => {
    const query = `
        SELECT 
            *
        FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session} 
        WHERE 
            id = $1;
    `;

    return pool.query(query, [id]);
};

const delete_by_id = (
    id: ULID_Type, 
    return_only_query = false
) : Promise<QueryResult<Auth_Session_Type>> | { query: string; values: any[] } => {
    const query = `
        DELETE FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session} 
        WHERE 
            id = $1
        RETURNING *;
    `;

    const values = [id];

    if (return_only_query) {
        return {
            query,
            values,
        };
    }

    return pool.query(query, values);
};

const update_selected_organization_id = (
    data: Auth_Session_Update_Organization_Id_Type,
    return_only_query = false
):
    | Promise<QueryResult<Auth_Session_Type>>
    | { query: string; values: unknown[] } => {
    const query = `
        UPDATE
            ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session}
        SET
            organization_id = $2,
            updated_at = $3::TIMESTAMPTZ
        WHERE
            id = $1
        RETURNING *;
    `;

    const values = [
        data.id,
        data.selected_organization_id,
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

const find_user_by_session_id = (
    session_id: ULID_Type
) : Promise<QueryResult<User_Type>> => {
    const query = `
        SELECT 
            user.*
        FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session} AS auth_session
        LEFT JOIN 
            ${User_Schema.SCHEMA}.${User_Schema.User} AS user 
        ON 
            auth_session.user_id = user.id
        WHERE 
            auth_session.id = $1;
    `;

    return pool.query(query, [session_id]);
};
export const Auth_Session_Model = {
    create,
    find_by_id,
    delete_by_id,
    update_selected_organization_id,
    find_user_by_session_id
};