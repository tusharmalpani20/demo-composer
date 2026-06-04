import {
    Api_Response_Type,
    response_message
} from "@repo/types";
import type { ZodSafeParseResult } from "zod";
import {
    Service_Response_Structure_Type,
    Service_Success_Response_Type
} from "../constants/response_structure.constants";
import { GeneralError } from "../errors/general-error copy";
import { RequestValidationError } from "../errors/request-validation-error";

export const print_general_error = ({
    url,
    message,
}: {
    url: string;
    message: string;
}) => {
    console.log(`${new Date().toLocaleString()} \t ${url} \n ${message}`);
};

export const print_error = (error: any, event_object: {
    event_name: string,
} | null, data_base_error: {
    function_name: string,
} | null) => {
    if (event_object) {

        console.log(`\n\n${new Date().toLocaleString()} \t ${event_object.event_name} \n ${error.message}\n\n`);
    }
    if (data_base_error) {

        console.log(`\n\n${new Date().toLocaleString()} \t ${data_base_error.function_name} \n ${error.message}\n\n`);
    }
};

export const service_response_handler = ({
    response,
    original_url,
}: {
    response: Service_Response_Structure_Type;
    original_url: string;
}): Api_Response_Type<any> => {
    switch (response.status) {
        case response_message.enum.success:
            break;
        case response_message.enum.error:
            print_general_error({
                url: original_url,
                message: (response).error_message,
            });
            throw new GeneralError(
                (response).code,
                (response).error_type,
                original_url,
                (response).status,
                (response).error_response
            );
            break;
    }

    const return_value: Api_Response_Type<any> = {
        code: response.code,
        message: response.status,
        path: original_url,
        result: (response as Service_Success_Response_Type).result,
        timestamp: new Date(),
    };

    return return_value;
};

export const validation_parser_handler = ({
    parse,
    original_url,
}: {
    parse: ZodSafeParseResult<any>;
    original_url: string;
}) => {
    if (parse.success === false) {
        // console.log(parse.error.issues)
        const result = parse.error.issues.map((issue) => {
            // if ((issue.message = "Invalid ulid")) {
            //   return {
            //     field: "id",
            //     message: "Invalid id",
            //   };
            // }
            switch (issue.code) {
                case "unrecognized_keys":
                    return {
                        field: issue.keys[0]?.toString() ?? "unknown field",
                        message: "Unrecognized key",
                    };
                    break;
                case "invalid_type":
                    return {
                        field: issue.path[0]?.toString() ?? "unknown field",
                        message: "Invalid type",
                    };
                    break;
                default:
                    return {
                        field: issue.path[0]?.toString() ?? "unknown field",
                        message: issue.message,
                    };
                    break;
            }
        });
        throw new RequestValidationError(result, original_url);
    }

    return parse.data;

};

export const parse_order_by_helper = (order_by: string, table_alias: string): string => {
    return order_by
        .split(",")
        .map((pair) => {
            const [field, direction] = pair.split(":") as [string, string];
            return `${table_alias}.${field} ${direction.toUpperCase()}`;
        })
        .join(", ");
};

export const format_file_size_helper = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    let size = Math.abs(bytes);
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    // Round to 2 decimal places
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
};