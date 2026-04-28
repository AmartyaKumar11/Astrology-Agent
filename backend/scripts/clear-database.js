/* eslint-disable no-console */
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', ''),
  ssl: { rejectUnauthorized: false },
});

async function clearDatabase() {
  const tables = [
    'jataka_yearly',
    'jataka_monthly',
    'jataka_weekly',
    'jataka_daily',
    'hil_reviews',
    'interpretations',
    'reports',
    'events',
    'charts',
    'birth_details',
    'consultations',
  ];
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    console.log(`cleared ${table}`);
  }
}

clearDatabase()
  .then(async () => {
    const q = await pool.query(`SELECT COUNT(*)::int AS count FROM consultations`);
    console.log(`consultations_count=${q.rows[0].count}`);
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err.message);
    await pool.end();
    process.exit(1);
  });
