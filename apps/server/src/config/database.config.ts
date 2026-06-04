import pg from "pg";
import pgPromise from "pg-promise";

export const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    max: Number(process.env.DB_MAX_POOL), // maximum number of connections in the pool
});

export const pgp = pgPromise();
export const pgpPool = pgp({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    max: Number(process.env.DB_MAX_POOL), // maximum number of connections in the pool
});
