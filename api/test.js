import dotenv from "dotenv";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const { Pool } = pkg;

async function runSupabaseTest() {
  console.log("Testing Supabase connection...");

  // Mask the password when logging the URL for safety
  const safeUrl = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@")
    : "UNDEFINED";
  console.log("Using Connection String:", safeUrl);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing in .env.local!");
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000, // Increased to 10 seconds
  });

  try {
    console.log("Attempting to connect...");
    const client = await pool.connect();

    console.log("Executing query...");
    const result = await client.query("SELECT version(), NOW()");

    client.release();
    await pool.end();

    console.log("✅ Connected to Supabase Successfully!");
    console.log("PostgreSQL Version:", result.rows[0].version.split(",")[0]);
    console.log("Server Time:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Supabase Connection Failed!");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
  }
}

runSupabaseTest();
