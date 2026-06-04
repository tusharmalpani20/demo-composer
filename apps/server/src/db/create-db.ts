import pg from "pg";

const dbName = process.env.DB_NAME;

if (!dbName) {
    console.error("❌ DB_NAME is not set in environment variables");
    process.exit(1);
}

const client = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    database: "postgres",
});

async function run() {
    try {
        await client.connect();

        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );

        if (result.rowCount && result.rowCount > 0) {
            console.log(`✅ Database "${dbName}" already exists`);
        } else {
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database "${dbName}" created successfully`);
        }
    } catch (error) {
        console.error("❌ Error creating database:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
