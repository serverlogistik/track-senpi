// Database configuration for Vercel + Supabase
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('ERROR: DATABASE_URL environment variable is not set!');
      throw new Error('DATABASE_URL is required');
    }

    console.log('Connecting to database...', connectionString.substring(0, 30) + '...');
    
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
      pool = null; // Reset pool on error
    });

    pool.on('connect', () => {
      console.log('Database connected successfully');
    });
  }
  return pool;
}

async function query(text, params) {
  const pool = getPool();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

module.exports = { query, getPool };
