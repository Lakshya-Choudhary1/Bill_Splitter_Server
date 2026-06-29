import { Client } from "pg";

import env from "../config/env.js";
import tables from "./tables.js";

const client = new Client({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Shared query helper keeps database logging consistent across controllers.
const query = async (sql, params) => {
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log("Connected to the database successfully.");

    await query(tables);
    console.log("Database tables created or already exist.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

export { connectToDatabase, query };
