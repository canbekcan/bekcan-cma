/**
 * File: backend/config/db.js
 * Description: Database connection setup using pg Pool, with startup auto-migration schema logic.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'db_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'db_name',
  password: process.env.DB_PASSWORD || 'db_password',
  port: process.env.DB_PORT || 5432,
});

// Database schema self-migration
const checkAndMigrateDb = async () => {
  try {
    // Add abbreviation column if missing
    await pool.query('ALTER TABLE conferences ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(50)');
    // Set seed value for default conference
    await pool.query("UPDATE conferences SET abbreviation = 'CRCP 2026' WHERE slug = 'bekcan2026' AND abbreviation IS NULL");
    console.log('[Database] Schema checked and migrated successfully.');
  } catch (err) {
    console.error('[Database] Migration error:', err);
  }
};

module.exports = {
  pool,
  checkAndMigrateDb
};
