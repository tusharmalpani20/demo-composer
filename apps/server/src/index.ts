import * as fs from "fs";
import { build } from "./app";

const LOG_LEVEL = {
    SILENT: 'silent',
    FATAL: 'fatal',
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace',
} as const;

const start = async () => {

    const app = build({
        logger: {
            level: LOG_LEVEL.WARN,
        }
    });

    if (!process.env.TZ) {
        throw new Error("Timezone must be defined!");
    }

    if (!process.env.SERVER_PORT) {
        throw new Error("SERVER_PORT must be defined!");
    }

    if (!process.env.DEV_TYPE) {
        throw new Error("DEV_TYPE must be defined!");
    }

    if (
        !process.env.DB_HOST ||
        !process.env.DB_PORT ||
        !process.env.DB_USER ||
        !process.env.DB_PASSWORD ||
        !process.env.DB_NAME ||
        !process.env.DB_MAX_POOL
    ) {
        throw new Error("Databse configuration must be defined!");
    }

    try {
        await app.listen({
            port: Number(process.env.SERVER_PORT),
            host: '0.0.0.0'
        });

        // after the ready or listen call
        const yaml = app.swagger({ yaml: true })
        fs.mkdirSync('./temp_folder', { recursive: true });
        fs.writeFileSync('./temp_folder/swagger.yml', yaml)
        const address = app.server.address();
        const addressLabel = typeof address === "string"
            ? address
            : `${address?.address ?? "0.0.0.0"}:${address?.port ?? process.env.SERVER_PORT}`;
        console.info(`Server is listening on ${addressLabel} and DEV_TYPE is ${process.env.DEV_TYPE}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

};

start();
