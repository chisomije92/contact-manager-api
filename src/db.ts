import pg from 'pg'
import dotenv from 'dotenv';
import fs from "fs"
import path from 'path';

const { Pool } = pg;

const readPemFile = () => {
  const file = path.join(process.cwd(), 'ca.pem');
  const stringified = fs.readFileSync(file, 'utf8');
  return stringified
}

dotenv.config();
const dbConfig: any = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    rejectUnauthorized: true,
    ca: readPemFile()
  },
};

// Create a connection pool and export
export const pool = new Pool(dbConfig);

// Define the tables and their creation SQL statements
export const createTables = async () => {
  
  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT, password TEXT, verification_token TEXT, is_verified BOOLEAN DEFAULT false, verification_token_exp BIGINT, forgot_password_token TEXT)');
    await client.query('CREATE TABLE IF NOT EXISTS contacts (id SERIAL PRIMARY KEY, first_name TEXT, last_name TEXT, phone_number TEXT,  user_id INTEGER REFERENCES users(id))');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
  }
};



