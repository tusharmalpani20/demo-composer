import { get_cookie_config } from "./cookie.config";
import { get_cors_config } from "./cors.config";
import {
    get_json_body_limit_bytes,
    get_max_screenshot_upload_bytes,
    get_rate_limit_config,
} from "./production-hardening.config";

const required_database_env = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_MAX_POOL",
];

const assert_env = (name: string, message: string) => {
    if (!process.env[name]) {
        throw new Error(message);
    }
};

export const validate_server_startup_config = () => {
    assert_env("TZ", "Timezone must be defined");
    assert_env("SERVER_PORT", "SERVER_PORT must be defined");
    assert_env("DEV_TYPE", "DEV_TYPE must be defined");

    if (required_database_env.some((name) => !process.env[name])) {
        throw new Error("Database configuration must be defined");
    }

    get_cookie_config();
    get_cors_config();
    get_json_body_limit_bytes();
    get_max_screenshot_upload_bytes();
    get_rate_limit_config();
};
