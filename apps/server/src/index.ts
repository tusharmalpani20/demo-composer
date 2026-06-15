import * as fs from "fs";
import { build } from "./app";
import { validate_server_startup_config } from "./config/startup.config";

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
    validate_server_startup_config();

    const app = build({
        logger: {
            level: LOG_LEVEL.WARN,
        }
    });

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
