import {
    Auth_Schema,
    Otp_Verification_For_Enum,
    Otp_Verification_Send_To_Eum,
    Otp_Verification_Status_Enum
} from "@repo/constants";
import {
    OTP_Verification_Create_Type,
    OTP_Verification_Type,
    OTP_Verification_Update_Type,
    ULID_Type
} from "@repo/types";
import { QueryResult } from "pg";
import { DatabaseConnectionError } from "../../../common/errors/database-connection-error";
import {
    pgpPool,
    pool
} from "../../../config/database.config";


const create_transaction = async (
    create_data: OTP_Verification_Create_Type,
    update_data: OTP_Verification_Update_Type | null
) : Promise<{ otp_verification: OTP_Verification_Type }> => {
    try {
        const return_value: {
            otp_verification: OTP_Verification_Type;
        } = await pgpPool.tx(async (t) => {

            if (update_data) {
                const update_query = await update(update_data, true) as {
                    query: string;
                    values: any[];
                };

                await t.query(
                    update_query.query,
                    update_query.values
                );
            }

            const otp_verification_create_query = await create(create_data, true) as {
                query: string;
                values: any[];
            };

            const otp_verification_create_result = await t.query(
                otp_verification_create_query.query,
                otp_verification_create_query.values
            );

            return {
                otp_verification: otp_verification_create_result[0]
            }
        });
        return return_value;
    } catch (error: any) {
        console.error("Transaction failed:", error);
        throw new DatabaseConnectionError(error.message);
    }
}

const create = (
    data: OTP_Verification_Create_Type, 
    return_only_query = false
) : Promise<QueryResult<OTP_Verification_Type>> | { query: string; values: any[] } => {

    const query = `
        INSERT INTO ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification} (
            "id",
            "send_to",
            "send_to_type",
            "otp_code",
            "otp_for",
            "otp_send_by",
            "metadata",
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
            $5,
            $6,
            $7::JSONB,
            $8,
            $9,
            $10::TIMESTAMPTZ,
            $11::TIMESTAMPTZ,
            $12::TIMESTAMPTZ
        ) RETURNING *;
    `;

    const values = [
        data.id,
        data.send_to,
        data.send_to_type,
        data.otp_code,
        data.otp_for,
        data.otp_send_by,
        data.metadata,
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

const update = (
    data: OTP_Verification_Update_Type, 
    return_only_query = false
) : Promise<QueryResult<OTP_Verification_Type>> | { query: string; values: any[] } => {

    const update_query: string[] = [];
    const values: any[] = [data.id];
    let update_query_index = 2;


    if (data.status) {
        update_query.push(`status = $${update_query_index}`);
        update_query_index++;
        values.push(data.status);
    }

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;
    values.push(data.updated_at);

    const query = `
        UPDATE 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification}
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

}

const find_by_id = (
    id: ULID_Type
): Promise<QueryResult<OTP_Verification_Type>> => {
    const query = `
        SELECT 
            *
        FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification} 
        WHERE 
            id = $1;
    `;

    return pool.query(query, [id]);
};

const delete_by_id = (
    id: ULID_Type, 
    return_only_query = false
) : Promise<QueryResult<OTP_Verification_Type>> | { query: string; values: any[] } => {
    const query = `
        DELETE FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification} 
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

const find_by_send_to_and_send_to_type_and_otp_for = (
    send_to: string,
    send_to_type: Otp_Verification_Send_To_Eum,
    otp_for: Otp_Verification_For_Enum
) : Promise<QueryResult<OTP_Verification_Type>> => {
    const query = `
        SELECT 
            * 
        FROM 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification} 
        WHERE 
            send_to = $1 
                AND 
            send_to_type = $2 
                AND 
            otp_for = $3;
    `;

    return pool.query(query, [send_to, send_to_type, otp_for]);
};

const increment_attempts = async (
    id: ULID_Type
): Promise<QueryResult<OTP_Verification_Type>> => {
    const query = `
        UPDATE 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification} 
        SET 
            attempt_count = attempt_count + 1,
            last_attempt_at = $2::TIMESTAMPTZ
        WHERE 
            id = $1
        RETURNING *;
    `;

    return pool.query(query, [id, new Date()]);
};

const update_otp_status = async (
    id: ULID_Type, 
    status: Otp_Verification_Status_Enum
) : Promise<QueryResult<OTP_Verification_Type>> => {
    const query = `
        UPDATE 
            ${Auth_Schema.SCHEMA}.${Auth_Schema.OTP_Verification} 
        SET 
            status = $2, 
            version = version + 1 
        WHERE 
            id = $1
        RETURNING *;
    `;

    return pool.query(query, [id, status]);
};

export const Otp_Verification_Model = {
    create_transaction,
    create,
    update,
    find_by_id,
    delete_by_id,
    find_by_send_to_and_send_to_type_and_otp_for,
    increment_attempts,
    update_otp_status
};