import { User_Me_Update_Type, User_Type } from "@repo/types";
import { DatabaseConnectionError } from "../../../common/errors/database-connection-error";
import { pgpPool, pool } from "../../../config/database.config";
import { User_Schema } from "@repo/constants";

const update_details_transaction = async (
    user_update_data: User_Me_Update_Type,
    user: User_Type
) => {
    try {
        const return_value: {
            user: User_Type
        } = await pgpPool.tx(async (t) => {

            const user_update_detail_query = await update_details(
                user_update_data,
                user,
                true
            ) as {
                query: string;
                values: any[];
            };

            const user_update_detail_result = await t.query(
                user_update_detail_query.query,
                user_update_detail_query.values
            );

            return {
                user: user_update_detail_result[0]
            };
        });
        return return_value;
    } catch (error: any) {
        console.error("Transaction failed:", error);
        throw new DatabaseConnectionError(error.message);
    }
};

const update_details = (
    data: User_Me_Update_Type,
    user: User_Type,
    return_only_query = false
) => {

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

    update_query.push(`version = version + 1`);

    update_query.push(`updated_at = $${update_query_index}::TIMESTAMPTZ`);
    update_query_index++;

    values.push(data.updated_at);

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
        return {
            query,
            values,
        };
    }

    return pool.query(query, values);
};

const update_password = (
    new_hased_password: string,
    user: User_Type
) => {
    const query = `
        UPDATE
            ${User_Schema.SCHEMA}.${User_Schema.User}
        SET
            password = $2,
            version = version + 1
        WHERE
            id = $1;
    `;

    const values = [user.id, new_hased_password];

    return pool.query(query, values);
};

export const User_Me_Model = {
    update_details_transaction,
    update_details,
    update_password
};
