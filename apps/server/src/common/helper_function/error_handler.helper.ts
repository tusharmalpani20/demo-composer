import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod";

const response_message = {
    enum: {
        error: "error",
    },
} as const;

const default_error = {
    code: 500,
    message: "Something went wrong",
    type: "internal_server_error",
};

export const error_handler = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    console.log("error handler")
    console.error(error);

    if (hasZodFastifySchemaValidationErrors(error)) {
        const field_errors = error.validation.map((validation_error) => {
            console.log(validation_error)
            return {
                field: validation_error.instancePath.replace("/", ""),
                message: validation_error.message,
                type: "validation_error"
            }
        })

        return reply.status(400).send({
            code: 400,
            message: response_message.enum.error,
            path: request.url,
            result: field_errors,
            timestamp: new Date().toISOString(),
        } as const)
    }

    if (isResponseSerializationError(error)) {
        //TODO: look what does this do
        //taken from fastify-type-provider-zod documentation
        // return reply.code(500).send({
        //     error: 'Internal Server Error',
        //     message: "Response doesn't match the schema",
        //     statusCode: 500,
        //     details: {
        //         issues: error.cause.issues,
        //         method: error.method,
        //         url: error.url,
        //     },
        // })
        return reply.code(500).send({
            code: 500,
            message: response_message.enum.error,
            path: request.url,
            result: [
                {
                    message: "Response doesn't match the schema",
                    field: "",
                    type: "response_serialization_error"
                }
            ],
            timestamp: new Date().toISOString(),
        })
    }

    return reply.status(default_error.code).send({
        code: default_error.code,
        path: request.url,
        message: response_message.enum.error,
        timestamp: new Date().toISOString(),
        result: [
            {
                message: default_error.message,
                type: default_error.type,
                field: ""
            },
        ],
    } as const);
};
