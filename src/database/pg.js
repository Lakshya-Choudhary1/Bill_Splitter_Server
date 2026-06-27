import { Client } from "pg";

import  tables  from "./tables.js";


import env from "../config/env.js";

const client = new Client({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const query = async (query, params) => {
  try {
    const result = await client.query(query, params);
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
