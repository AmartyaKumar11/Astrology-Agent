/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL;

const TABLES = [
  'consultations',
  'birth_details',
  'charts',
  'interpretations',
  'hil_reviews',
  'events',
  'reports',
  'jataka_daily',
  'jataka_weekly',
  'jataka_monthly',
  'jataka_yearly',
];

const checks = [];
function addCheck(group, name, status, details = '') {
  checks.push({ group, name, status, details });
  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${name}${details ? ` — ${details}` : ''}`);
}

async function api(pathname) {
  const res = await fetch(`${API_BASE}${pathname}`);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

async function runDatabaseAudit() {
  console.log('\n================ DATABASE AUDIT ================');
  if (!DATABASE_URL) {
    addCheck('database', 'DATABASE_URL present', 'fail', 'Set DATABASE_URL before running audit');
    return;
  }

  const pool = new Pool({
    connectionString: DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', ''),
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tableResult = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema='public'`
    );
    const existing = new Set(tableResult.rows.map((r) => r.table_name));
    for (const t of TABLES) {
      addCheck('database', `Table exists: ${t}`, existing.has(t) ? 'pass' : 'fail');
    }

    const cCount = await pool.query(`SELECT COUNT(*)::int AS count FROM consultations WHERE deleted_at IS NULL`);
    const consultations = cCount.rows[0].count;
    addCheck('database', 'Consultations present', consultations > 0 ? 'pass' : 'fail', `count=${consultations}`);

    const iCount = await pool.query(`SELECT COUNT(*)::int AS count FROM interpretations`);
    addCheck(
      'database',
      'Interpretations present',
      iCount.rows[0].count > 0 ? 'pass' : 'fail',
      `count=${iCount.rows[0].count}`
    );

    const perConsultation = await pool.query(
      `SELECT c.consultation_id, COUNT(i.*)::int AS count
       FROM consultations c
       LEFT JOIN interpretations i ON i.consultation_ref = c.id
       WHERE c.deleted_at IS NULL
       GROUP BY c.consultation_id`
    );
    const missing5 = perConsultation.rows.filter((r) => r.count < 5).length;
    addCheck(
      'database',
      'All consultations have >=5 interpretations',
      missing5 === 0 ? 'pass' : 'warn',
      `missing=${missing5}`
    );

    const remedyMissing = await pool.query(
      `SELECT COUNT(*)::int AS count FROM interpretations WHERE remedy IS NULL OR TRIM(remedy)=''`
    );
    addCheck(
      'database',
      'Remedies present on interpretations',
      remedyMissing.rows[0].count === 0 ? 'pass' : 'warn',
      `missing=${remedyMissing.rows[0].count}`
    );

    const invalidConfidence = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM interpretations
       WHERE confidence_score IS NULL OR confidence_score < 0 OR confidence_score > 1`
    );
    addCheck(
      'database',
      'Confidence scores valid (0..1)',
      invalidConfidence.rows[0].count === 0 ? 'pass' : 'warn',
      `invalid=${invalidConfidence.rows[0].count}`
    );

    const dailyCount = await pool.query(`SELECT COUNT(*)::int AS count FROM jataka_daily`);
    const weeklyCount = await pool.query(`SELECT COUNT(*)::int AS count FROM jataka_weekly`);
    const monthlyCount = await pool.query(`SELECT COUNT(*)::int AS count FROM jataka_monthly`);
    addCheck('database', 'Daily jataka rows present', dailyCount.rows[0].count > 0 ? 'pass' : 'warn');
    addCheck('database', 'Weekly jataka rows present', weeklyCount.rows[0].count > 0 ? 'pass' : 'warn');
    addCheck('database', 'Monthly jataka rows present', monthlyCount.rows[0].count > 0 ? 'pass' : 'warn');
  } catch (err) {
    addCheck('database', 'Database connection/query', 'fail', err.message);
  } finally {
    await pool.end();
  }
}

async function runApiAudit() {
  console.log('\n================ API ENDPOINT AUDIT ================');
  const health = await api('/health');
  addCheck('api', 'GET /health', health.ok ? 'pass' : 'fail', `status=${health.status}`);

  const consultations = await api('/consultations?limit=50');
  addCheck('api', 'GET /consultations', consultations.ok ? 'pass' : 'fail', `status=${consultations.status}`);
  if (!consultations.ok || !Array.isArray(consultations.body?.data) || !consultations.body.data.length) {
    addCheck('api', 'Consultations data available for deeper checks', 'fail');
    return;
  }

  const sample = consultations.body.data[0];
  addCheck('api', 'Consultation row has status', sample.status ? 'pass' : 'fail');
  addCheck('api', 'Consultation row has id', sample.consultation_id ? 'pass' : 'fail');

  const id = sample.consultation_id;
  const detail = await api(`/consultations/${id}`);
  addCheck('api', 'GET /consultations/:id', detail.ok ? 'pass' : 'fail', `status=${detail.status}`);
  if (detail.ok) {
    const body = detail.body || {};
    addCheck('api', 'Birth details complete', body.birth_data ? 'pass' : 'warn');
    addCheck('api', 'Chart data complete', body.chart ? 'pass' : 'warn');
    addCheck('api', 'Interpretations array present', Array.isArray(body.interpretations) ? 'pass' : 'fail');
    const hasRemedy = Array.isArray(body.interpretations) && body.interpretations.some((i) => 'remedy' in i);
    addCheck('api', 'Interpretations include remedy field', hasRemedy ? 'pass' : 'fail');
  }

  const chart = await api(`/consultations/${id}/chart`);
  addCheck('api', 'GET /consultations/:id/chart', chart.ok ? 'pass' : 'warn', `status=${chart.status}`);

  const hil = await api('/hil/pending');
  addCheck('api', 'GET /hil/pending', hil.ok ? 'pass' : 'fail', `status=${hil.status}`);

  const daily = await api(`/consultations/${id}/jataka/daily`);
  const weekly = await api(`/consultations/${id}/jataka/weekly`);
  const monthly = await api(`/consultations/${id}/jataka/monthly`);
  addCheck('api', 'GET /consultations/:id/jataka/daily', daily.ok ? 'pass' : 'warn', `status=${daily.status}`);
  addCheck('api', 'GET /consultations/:id/jataka/weekly', weekly.ok ? 'pass' : 'warn', `status=${weekly.status}`);
  addCheck('api', 'GET /consultations/:id/jataka/monthly', monthly.ok ? 'pass' : 'warn', `status=${monthly.status}`);
}

function runFrontendAudit() {
  console.log('\n================ FRONTEND COMPONENT AUDIT ================');
  const root = path.resolve(__dirname, '..', '..', 'src');
  const queue = readFileSafe(path.join(root, 'pages', 'Queue.jsx'));
  const consultation = readFileSafe(path.join(root, 'pages', 'Consultation.jsx'));
  const hil = readFileSafe(path.join(root, 'pages', 'HILBoard.jsx'));
  const jataka = readFileSafe(path.join(root, 'components', 'JatakaReportsSection.jsx'));
  const services = [
    readFileSafe(path.join(root, 'services', 'consultationService.js')),
    readFileSafe(path.join(root, 'services', 'hilService.js')),
    readFileSafe(path.join(root, 'services', 'reportService.js')),
    readFileSafe(path.join(root, 'services', 'jatakaService.js')),
  ].join('\n');

  addCheck('frontend', 'Queue page wired to consultationService', queue.includes('consultationService.list') ? 'pass' : 'fail');
  addCheck(
    'frontend',
    'Consultation detail wired to consultationService',
    consultation.includes('consultationService.getById') ? 'pass' : 'fail'
  );
  addCheck('frontend', 'HIL board wired to consultationService', hil.includes('consultationService.list') ? 'pass' : 'fail');
  addCheck('frontend', 'Jataka section wired to jatakaService', jataka.includes('jatakaService.getDaily') ? 'pass' : 'fail');
  addCheck('frontend', 'Service layer files exist', services.includes('apiRequest') ? 'pass' : 'fail');

  addCheck('frontend', 'Queue has fallback path', queue.includes('setConsultations(MOCK_DATA)') ? 'warn' : 'pass');
  addCheck('frontend', 'Consultation has fallback path', consultation.includes('setBase(fallback)') ? 'warn' : 'pass');
  addCheck('frontend', 'HIL board has fallback path', hil.includes('setConsultations(MOCK_DATA)') ? 'warn' : 'pass');
}

function printSummary() {
  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warned = checks.filter((c) => c.status === 'warn').length;
  const total = checks.length;
  const health = total ? Math.round((passed / total) * 100) : 0;

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⚠️  Warnings: ${warned}/${total}`);
  console.log(`📊 Health: ${health}%`);

  if (failed) {
    console.log('\nFailed checks:');
    checks
      .filter((c) => c.status === 'fail')
      .forEach((c) => console.log(`- [${c.group}] ${c.name}${c.details ? ` (${c.details})` : ''}`));
  }
}

async function main() {
  console.log('Running COMPLETE VERIFICATION AUDIT...\n');
  await runDatabaseAudit();
  await runApiAudit();
  runFrontendAudit();
  printSummary();
}

main().catch((err) => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
