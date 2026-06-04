import {
    Auth_Session_Init_Data_Create_Type,
    Auth_Session_Init_Data_Type,
    ULID_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { pool } from "../../../config/database.config";
import { Auth_Schema } from "@repo/constants";


const create = (data: Auth_Session_Init_Data_Create_Type, return_only_query = false) => {

    const query = `
        INSERT INTO ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session_Init_Data} (
            "id",
            "ip_address",
            "user_agent",
            "expires_at",
            "created_at",
            "updated_at"
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5::TIMESTAMPTZ,
            $6::TIMESTAMPTZ
        ) RETURNING *;
    `;

    const values = [
        data.id,
        data.ip_address,
        data.user_agent,
        data.expires_at,
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

const find_by_id = (id: ULID_Type): Promise<QueryResult<Auth_Session_Init_Data_Type>> => {
    const query = `
        SELECT 
            *
        FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session_Init_Data} 
        WHERE 
            id = $1;
    `;

    return pool.query(query, [id]);
};

const delete_by_id = (id: ULID_Type, return_only_query = false) => {
    const query = `
        DELETE FROM ${Auth_Schema.SCHEMA}.${Auth_Schema.Auth_Session_Init_Data} WHERE id = $1;
    `;

    const values = [id];

    if (return_only_query) {
        return {
            query,
            values,
        };
    }

    return pool.query(query, values);
}

export const Auth_Session_Init_Data_Model = {
    create,
    find_by_id,
    delete_by_id,
};