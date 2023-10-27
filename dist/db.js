var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();
const dbConfig = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
};
// Create a connection pool and export
export const pool = new Pool(dbConfig);
// Define the tables and their creation SQL statements
export const createTables = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield pool.connect();
    try {
        yield client.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT, password TEXT)');
        yield client.query('CREATE TABLE IF NOT EXISTS contacts (id SERIAL PRIMARY KEY, first_name TEXT, last_name TEXT, phone_number TEXT)');
    }
    catch (err) {
        console.error('Error creating tables:', err);
    }
    finally {
        client.release();
    }
});
//# sourceMappingURL=db.js.map