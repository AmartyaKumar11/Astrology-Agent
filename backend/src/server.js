const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { formatHindiEnglish } = require('./utils/astrology-terms');

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL');
}
const NORMALIZED_DB_URL = DATABASE_URL
  .replace('?sslmode=require', '')
  .replace('&sslmode=require', '');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = new Pool({
  connectionString: NORMALIZED_DB_URL,
  ssl: { rejectUnauthorized: false },
});

let queues = null;
if (process.env.REDIS_URL) {
  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  queues = {
    compute: new Queue('compute-queue', { connection }),
    report: new Queue('report-queue', { connection }),
    jataka: new Queue('jataka-queue', { connection }),
  };
}

const STATUS = ['QUEUED', 'PROCESSING', 'INTERPRETING', 'HIL_PENDING', 'COMPLETE'];
const HIL_ACTIONS = ['approve', 'reject', 'modify'];
const INTERP_KEYS = ['career', 'finance', 'health', 'relations', 'muhurta'];
const REQUIRED_CONCERNS = ['career', 'finance', 'health', 'relations', 'muhurta'];

function mapStatusLabel(status) {
  return status;
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseConcerns(value) {
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

function parseHousePlacements(value) {
  const out = {};
  String(value || '')
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [house, planets] = entry.split(':').map((x) => x.trim());
      if (!house || !planets) return;
      out[house] = planets.split('+');
    });
  return out;
}

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function emitEvent(consultationId, eventType, message, payload = {}) {
  await pool.query(
    `INSERT INTO events (consultation_id, event_type, message, payload)
     VALUES ($1, $2, $3, $4)`,
    [consultationId, eventType, message, payload]
  );
  const event = {
    type: eventType,
    payload: { consultation_id: consultationId, message, ...payload, timestamp: new Date().toISOString() },
  };
  io.to(`consultation:${consultationId}`).emit(eventType, event);
  io.to('consultations:all').emit(eventType, event);
}

function queueOrRun(taskName, fn) {
  if (queues) {
    const target =
      taskName === 'generate_report' ? queues.report :
      taskName.startsWith('generate_jataka') ? queues.jataka : queues.compute;
    return target.add(taskName, {});
  }
  setTimeout(fn, 20);
  return Promise.resolve();
}

async function migrate() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_id TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      concerns JSONB DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'QUEUED',
      processing_time TEXT,
      received_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      report_ready BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS birth_details (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE UNIQUE,
      dob TEXT,
      tob TEXT,
      pob TEXT,
      coordinates TEXT,
      timezone TEXT,
      ayanamsa TEXT,
      lagna TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS charts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE UNIQUE,
      house_placements JSONB DEFAULT '{}'::jsonb,
      active_mahadasha TEXT,
      active_antardasha TEXT,
      dasha_ends TEXT,
      dasha_started_at TIMESTAMP DEFAULT NOW(),
      yogas JSONB DEFAULT '[]'::jsonb,
      doshas JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS interpretations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE,
      concern TEXT NOT NULL,
      insight TEXT,
      remedy TEXT,
      confidence_score NUMERIC(5,2) DEFAULT 70,
      planet_indicator TEXT,
      flagged BOOLEAN DEFAULT FALSE,
      flag_reason TEXT,
      hil_status TEXT DEFAULT 'pending',
      hil_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hil_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE,
      interpretation_ref UUID REFERENCES interpretations(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      reviewer_name TEXT,
      reviewer_notes TEXT,
      modified_text TEXT,
      reviewed_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT,
      payload JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE UNIQUE,
      content_json JSONB DEFAULT '{}'::jsonb,
      pdf_url TEXT,
      delivery_status TEXT DEFAULT 'pending',
      generated_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jataka_daily (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE,
      report_date DATE NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS jataka_weekly (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE,
      week_start DATE NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS jataka_monthly (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE,
      month_key TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS jataka_yearly (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_ref UUID REFERENCES consultations(id) ON DELETE CASCADE,
      year_key TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);

  await pool.query(`ALTER TABLE charts ADD COLUMN IF NOT EXISTS dasha_started_at TIMESTAMP DEFAULT NOW()`);
  await pool.query(`ALTER TABLE interpretations ADD COLUMN IF NOT EXISTS remedy TEXT`);
}

async function seedFromCsvIfEmpty() {
  const existing = await pool.query(`SELECT COUNT(*)::int AS count FROM consultations`);
  if (existing.rows[0].count > 0) return;

  const csvPath = path.resolve(__dirname, '..', '..', '..', 'astrology_agent_v4.csv');
  if (!fs.existsSync(csvPath)) return;
  const raw = fs.readFileSync(csvPath, 'utf8');
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  for (const row of records) {
    const consultationId = row['Consultation ID'];
    const status = row['Status'] || 'QUEUED';
    const concerns = parseConcerns(row['Concerns']);
    const receivedAt = row['Received At'] || new Date().toISOString();

    const cRes = await pool.query(
      `INSERT INTO consultations
       (consultation_id, client_name, client_email, concerns, status, processing_time, received_at, report_ready)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        consultationId,
        row['Name'] || 'Unknown',
        row['Email'] || '',
        JSON.stringify(concerns),
        STATUS.includes(status) ? status : 'QUEUED',
        row['Processing Time'] || null,
        receivedAt,
        status === 'COMPLETE',
      ]
    );
    const consultationRef = cRes.rows[0].id;

    await pool.query(
      `INSERT INTO birth_details
       (consultation_ref, dob, tob, pob, coordinates, timezone, ayanamsa, lagna)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        consultationRef,
        row['Date of Birth'] || '',
        row['Time of Birth'] || '',
        row['Place of Birth'] || '',
        row['Coordinates'] || '',
        row['Timezone'] || '',
        row['Ayanamsa'] || '',
        row['Lagna'] || '',
      ]
    );

    await pool.query(
      `INSERT INTO charts
       (consultation_ref, house_placements, active_mahadasha, active_antardasha, dasha_ends, yogas, doshas)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        consultationRef,
        JSON.stringify(parseHousePlacements(row['Rasi Chart (House:Planets)'])),
        row['Active Mahadasha'] || '',
        row['Active Antardasha'] || '',
        row['Dasha Ends'] || '',
        JSON.stringify(parseConcerns(row['Yogas'])),
        JSON.stringify(parseConcerns(row['Doshas'])),
      ]
    );

    const interpRows = [
      ['career', row['Career Insight'], row['Career Planet']],
      ['finance', row['Finance Insight'], row['Finance Planet']],
      ['health', row['Health Insight'], row['Health Planet']],
      ['relations', row['Relations Insight'], row['Relations Planet']],
      ['muhurta', row['Muhurta Insight'], row['Muhurta Planet']],
    ];
    for (const [concern, insight, planet] of interpRows) {
      await pool.query(
        `INSERT INTO interpretations
         (consultation_ref, concern, insight, remedy, confidence_score, planet_indicator, flagged, hil_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          consultationRef,
          concern,
          insight || '',
          row['Remedy'] || '',
          concern === 'health' ? 0.62 : 0.78,
          planet || '',
          status === 'HIL_PENDING' && (concern === 'health' || concern === 'finance'),
          status === 'HIL_PENDING' ? 'pending' : 'approved',
        ]
      );
    }

    await pool.query(
      `INSERT INTO reports
       (consultation_ref, content_json, pdf_url, delivery_status, generated_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        consultationRef,
        JSON.stringify({
          client_name: row['Name'],
          birth_data: {
            dob: row['Date of Birth'],
            tob: row['Time of Birth'],
            pob: row['Place of Birth'],
            coordinates: row['Coordinates'],
            timezone: row['Timezone'],
          },
          chart_analysis: {
            lagna: row['Lagna'],
            active_mahadasha: row['Active Mahadasha'],
            active_antardasha: row['Active Antardasha'],
          },
        }),
        null,
        status === 'COMPLETE' ? 'sent' : 'pending',
        status === 'COMPLETE' ? new Date() : null,
      ]
    );

    const nowMonth = new Date().toISOString().slice(0, 7);
    await pool.query(
      `INSERT INTO jataka_daily (consultation_ref, report_date, data)
       VALUES ($1, CURRENT_DATE, $2)`,
      [
        consultationRef,
        JSON.stringify({
          vara: row['Daily Vara (Day)'],
          tithi: row['Daily Tithi'],
          nakshatra: row['Daily Nakshatra'],
          yoga: row['Daily Yoga (Panchanga)'],
          karana: row['Daily Karana'],
          lucky_numbers: parseConcerns(row['Daily Lucky Numbers']).map((x) => Number(x)).filter((x) => !Number.isNaN(x)),
          forecast: row['Daily Jataka Forecast'],
        }),
      ]
    );
    await pool.query(
      `INSERT INTO jataka_weekly (consultation_ref, week_start, data)
       VALUES ($1, CURRENT_DATE, $2)`,
      [consultationRef, JSON.stringify({ forecast: row['Weekly Jataka Forecast'] || '' })]
    );
    await pool.query(
      `INSERT INTO jataka_monthly (consultation_ref, month_key, data)
       VALUES ($1, $2, $3)`,
      [consultationRef, nowMonth, JSON.stringify({ forecast: row['Monthly Jataka Forecast'] || '' })]
    );
    await pool.query(
      `INSERT INTO jataka_yearly (consultation_ref, year_key, data)
       VALUES ($1, $2, $3)`,
      [consultationRef, String(new Date().getFullYear()), JSON.stringify({ forecast: row['Yearly Jataka Forecast'] || '' })]
    );
  }
}

async function getConsultationByPublicId(publicId) {
  const base = await pool.query(
    `SELECT * FROM consultations WHERE consultation_id = $1 AND deleted_at IS NULL`,
    [publicId]
  );
  if (!base.rows.length) return null;
  const c = base.rows[0];
  const birth = await pool.query(`SELECT * FROM birth_details WHERE consultation_ref = $1`, [c.id]);
  const chart = await pool.query(`SELECT * FROM charts WHERE consultation_ref = $1`, [c.id]);
  const interpretations = await pool.query(
    `SELECT * FROM interpretations WHERE consultation_ref = $1 ORDER BY created_at ASC`,
    [c.id]
  );
  const events = await pool.query(
    `SELECT * FROM events WHERE consultation_id = $1 ORDER BY created_at ASC LIMIT 200`,
    [publicId]
  );

  const normalizedInterpretations = interpretations.rows.map((it) => ({
    id: it.id,
    concern: it.concern,
    insight: it.insight,
    remedy: it.remedy || null,
    confidence_score: Number(it.confidence_score),
    planet_indicator: it.planet_indicator,
    flagged: it.flagged,
    flag_reason: it.flag_reason,
    hil_status: it.hil_status,
    hil_notes: it.hil_notes,
  }));

  const concernSet = new Set(normalizedInterpretations.map((it) => String(it.concern || '').toLowerCase()));
  const missingConcerns = REQUIRED_CONCERNS.filter((cName) => !concernSet.has(cName));

  return {
    id: c.id,
    consultation_id: c.consultation_id,
    client: { name: c.client_name, email: c.client_email, phone: null },
    birth_data: birth.rows[0] || null,
    chart: chart.rows[0]
      ? {
          ...chart.rows[0],
          lagna_sign_hindi: formatHindiEnglish(birth.rows[0]?.lagna || ''),
          lagna_display: formatHindiEnglish(birth.rows[0]?.lagna || ''),
        }
      : null,
    concerns: safeJsonParse(c.concerns, []),
    status: mapStatusLabel(c.status),
    processing_time_ms: c.processing_time,
    received_at: c.received_at,
    completed_at: c.completed_at,
    report_ready: c.report_ready,
    interpretations_count: normalizedInterpretations.length,
    interpretations: normalizedInterpretations,
    warnings: missingConcerns.length ? { missing_concerns: missingConcerns } : null,
    events: events.rows,
  };
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
});

app.get('/ready', (_req, res) => {
  res.json({ ready: true });
});

app.get('/metrics', async (_req, res) => {
  const c = await pool.query(`SELECT COUNT(*)::int AS total FROM consultations WHERE deleted_at IS NULL`);
  res.json({ consultations_total: c.rows[0].total });
});

app.get('/consultations', async (req, res) => {
  const { status, search = '', limit = 100, offset = 0 } = req.query;
  const params = [];
  const where = ['deleted_at IS NULL'];
  if (status) {
    params.push(status === 'PROCESSING' ? 'QUEUED' : status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(client_name ILIKE $${params.length} OR client_email ILIKE $${params.length} OR consultation_id ILIKE $${params.length})`);
  }
  const filterParams = [...params];
  params.push(Number(limit));
  params.push(Number(offset));

  const sql = `
    SELECT *
    FROM consultations
    WHERE ${where.join(' AND ')}
    ORDER BY received_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const rows = await pool.query(sql, params);
  const totalQ = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM consultations
     WHERE ${where.join(' AND ')}`,
    filterParams
  );
  res.json({
    data: rows.rows.map((r) => ({
      id: r.consultation_id,
      consultation_id: r.consultation_id,
      client_name: r.client_name,
      client_email: r.client_email,
      status: mapStatusLabel(r.status),
      processing_time: r.processing_time,
      received_at: r.received_at,
      overall_confidence: 0.76,
      concerns: safeJsonParse(r.concerns, []),
    })),
    total: totalQ.rows[0].total,
    limit: Number(limit),
    offset: Number(offset),
  });
});

app.post('/consultations', async (req, res) => {
  const body = req.body || {};
  const now = new Date();
  const seq = Math.floor(Math.random() * 900) + 100;
  const consultationId = `ASTRO-${now.getFullYear()}-${seq}`;
  const concerns = body.concerns || [];

  const cRes = await pool.query(
    `INSERT INTO consultations (consultation_id, client_name, client_email, concerns, status, received_at)
     VALUES ($1,$2,$3,$4,'QUEUED',NOW()) RETURNING *`,
    [consultationId, body.client_name || 'Unknown', body.client_email || '', JSON.stringify(concerns)]
  );
  const consultation = cRes.rows[0];
  await pool.query(
    `INSERT INTO birth_details (consultation_ref, dob, tob, pob, coordinates, timezone, ayanamsa, lagna)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      consultation.id,
      body.birth_data?.dob || '',
      body.birth_data?.tob || '',
      body.birth_data?.pob || '',
      body.birth_data?.coordinates || '',
      body.birth_data?.timezone || 'UTC+5:30',
      body.birth_data?.ayanamsa || 'Lahiri',
      null,
    ]
  );
  await emitEvent(consultationId, 'consultation_created', 'Consultation created', { new_status: 'QUEUED' });

  res.status(201).json({
    id: consultation.id,
    consultation_id: consultation.consultation_id,
    status: mapStatusLabel(consultation.status),
    received_at: consultation.received_at,
  });
});

app.get('/consultations/:id', async (req, res) => {
  const result = await getConsultationByPublicId(req.params.id);
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json(result);
});

app.patch('/consultations/:id', async (req, res) => {
  const fields = [];
  const values = [];
  const { client_name, client_email, concerns } = req.body || {};
  if (client_name !== undefined) {
    values.push(client_name);
    fields.push(`client_name = $${values.length}`);
  }
  if (client_email !== undefined) {
    values.push(client_email);
    fields.push(`client_email = $${values.length}`);
  }
  if (concerns !== undefined) {
    values.push(JSON.stringify(concerns));
    fields.push(`concerns = $${values.length}`);
  }
  if (!fields.length) return res.json({ ok: true });
  values.push(req.params.id);
  const q = await pool.query(
    `UPDATE consultations SET ${fields.join(', ')}, updated_at = NOW()
     WHERE consultation_id = $${values.length} RETURNING *`,
    values
  );
  if (!q.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ id: q.rows[0].consultation_id, updated_at: q.rows[0].updated_at });
});

app.patch('/consultations/:id/status', async (req, res) => {
  const status = req.body?.status;
  if (!status) return res.status(400).json({ error: 'status required' });
  const dbStatus = status;
  if (!STATUS.includes(dbStatus)) return res.status(400).json({ error: 'invalid status' });
  const q = await pool.query(
    `UPDATE consultations SET status = $1, updated_at = NOW(), completed_at = CASE WHEN $1='COMPLETE' THEN NOW() ELSE completed_at END
     WHERE consultation_id = $2 RETURNING *`,
    [dbStatus, req.params.id]
  );
  if (!q.rows.length) return res.status(404).json({ error: 'Not found' });
  await emitEvent(req.params.id, 'status_change', `Status updated to ${status}`, { new_status: status });
  res.json({ id: q.rows[0].consultation_id, status });
});

app.delete('/consultations/:id', async (req, res) => {
  await pool.query(`UPDATE consultations SET deleted_at = NOW() WHERE consultation_id = $1`, [req.params.id]);
  res.json({ ok: true });
});

app.post('/astrology/compute', async (req, res) => {
  const birth = req.body?.birth_data || {};
  const house = ((Number(String(birth.dob || '1').replace(/[^0-9]/g, '')) || 1) % 12) + 1;
  res.json({
    lagna: 'Aries',
    rasi_chart: { house_placements: { [`H${house}`]: 'Su', H7: 'Mo', H10: 'Ju' } },
    planet_positions: { Sun: { house }, Moon: { house: 7 }, Jupiter: { house: 10 } },
    mahadasha: { active: 'Saturn', sub_period: 'Mercury', ends_at: '2030-01-01' },
    yogas: ['Raj Yoga'],
    doshas: [],
    interpretations: [{ concern: 'career', text: 'Steady growth indicated', confidence: 0.78 }],
  });
});

app.get('/consultations/:id/chart', async (req, res) => {
  const q = await pool.query(
    `SELECT ch.* FROM charts ch
     JOIN consultations c ON c.id = ch.consultation_ref
     WHERE c.consultation_id = $1`,
    [req.params.id]
  );
  if (!q.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(q.rows[0]);
});

app.post('/consultations/:id/recompute', async (req, res) => {
  await emitEvent(req.params.id, 'agent_log', 'Recompute requested', { progress: 0.1 });
  queueOrRun('compute_astrology', async () => {
    await emitEvent(req.params.id, 'agent_log', 'Recompute completed', { progress: 1 });
  });
  res.json({ ok: true, queued: true });
});

app.get('/consultations/:id/interpretations', async (req, res) => {
  const q = await pool.query(
    `SELECT i.* FROM interpretations i
     JOIN consultations c ON c.id = i.consultation_ref
     WHERE c.consultation_id = $1 ORDER BY i.created_at ASC`,
    [req.params.id]
  );
  res.json({ data: q.rows });
});

app.post('/consultations/:id/interpretations', async (req, res) => {
  const body = req.body || {};
  const c = await pool.query(`SELECT id FROM consultations WHERE consultation_id = $1`, [req.params.id]);
  if (!c.rows.length) return res.status(404).json({ error: 'Not found' });
  const q = await pool.query(
    `INSERT INTO interpretations
     (consultation_ref, concern, insight, remedy, confidence_score, planet_indicator, flagged, flag_reason, hil_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      c.rows[0].id,
      body.concern || 'general',
      body.insight || '',
      body.remedy || null,
      body.confidence_score ?? 0.75,
      body.planet_indicator || '',
      !!body.flagged,
      body.flag_reason || null,
      body.flagged ? 'pending' : 'approved',
    ]
  );
  await emitEvent(req.params.id, 'interpretation_added', `Interpretation added: ${body.concern || 'general'}`);
  res.status(201).json(q.rows[0]);
});

app.post('/interpretations', async (req, res) => {
  const body = req.body || {};
  if (!body.consultation_id) return res.status(400).json({ error: 'consultation_id required' });
  const c = await pool.query(`SELECT id, consultation_id FROM consultations WHERE consultation_id = $1`, [body.consultation_id]);
  if (!c.rows.length) return res.status(404).json({ error: 'Consultation not found' });
  const q = await pool.query(
    `INSERT INTO interpretations
     (consultation_ref, concern, insight, remedy, confidence_score, planet_indicator, flagged, flag_reason, hil_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      c.rows[0].id,
      body.concern || 'general',
      body.insight || '',
      body.remedy || null,
      body.confidence_score ?? 0.75,
      body.planet_indicator || '',
      !!body.flagged,
      body.flag_reason || null,
      body.flagged ? 'pending' : 'approved',
    ]
  );
  await emitEvent(body.consultation_id, 'interpretation_added', `Interpretation added: ${body.concern || 'general'}`);
  res.status(201).json(q.rows[0]);
});

app.patch('/interpretations/:interpretationId', async (req, res) => {
  const body = req.body || {};
  const q = await pool.query(
    `UPDATE interpretations
     SET insight = COALESCE($1, insight),
         confidence_score = COALESCE($2, confidence_score),
         flagged = COALESCE($3, flagged),
         flag_reason = COALESCE($4, flag_reason),
         remedy = COALESCE($5, remedy),
         updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [body.insight, body.confidence_score, body.flagged, body.flag_reason, body.remedy, req.params.interpretationId]
  );
  if (!q.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(q.rows[0]);
});

app.post('/consultations/:id/interpretations/generate', async (req, res) => {
  const c = await pool.query(`SELECT id FROM consultations WHERE consultation_id = $1`, [req.params.id]);
  if (!c.rows.length) return res.status(404).json({ error: 'Not found' });
  for (const concern of INTERP_KEYS) {
    await pool.query(
      `INSERT INTO interpretations (consultation_ref, concern, insight, confidence_score, planet_indicator, flagged, hil_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [c.rows[0].id, concern, `${concern} guidance generated`, 0.72, 'Jupiter', concern === 'health', concern === 'health' ? 'pending' : 'approved']
    );
    await emitEvent(req.params.id, 'interpretation_added', `Interpretation generated: ${concern}`);
  }
  await emitEvent(req.params.id, 'agent_log', 'Interpretations generated', { progress: 0.8 });
  res.json({ ok: true });
});

app.get('/hil/pending', async (_req, res) => {
  const q = await pool.query(
    `SELECT c.consultation_id, i.id AS interpretation_id, i.concern, i.insight AS current_text, i.insight,
            i.planet_indicator, i.confidence_score, i.remedy
     FROM interpretations i
     JOIN consultations c ON c.id = i.consultation_ref
     WHERE i.hil_status = 'pending' AND c.deleted_at IS NULL
     ORDER BY c.received_at DESC`
  );
  res.json({ data: q.rows, total: q.rows.length });
});

app.post('/consultations/:id/hil/decision', async (req, res) => {
  const body = req.body || {};
  if (!HIL_ACTIONS.includes(body.action)) return res.status(400).json({ error: 'invalid action' });

  const i = await pool.query(
    `SELECT i.*, c.id AS consultation_ref
     FROM interpretations i JOIN consultations c ON c.id = i.consultation_ref
     WHERE c.consultation_id = $1 AND i.id = $2`,
    [req.params.id, body.interpretation_id]
  );
  if (!i.rows.length) return res.status(404).json({ error: 'Interpretation not found' });
  const interp = i.rows[0];

  const nextInsight = body.action === 'modify' ? (body.modified_text || interp.insight) : interp.insight;
  const nextStatus = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'modified';
  await pool.query(
    `UPDATE interpretations
     SET insight = $1, hil_status = $2, hil_notes = $3, flagged = FALSE, updated_at = NOW()
     WHERE id = $4`,
    [nextInsight, nextStatus, body.notes || null, interp.id]
  );
  const review = await pool.query(
    `INSERT INTO hil_reviews (consultation_ref, interpretation_ref, action, reviewer_name, reviewer_notes, modified_text)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [interp.consultation_ref, interp.id, body.action, body.reviewer_name || 'Reviewer', body.notes || '', body.modified_text || null]
  );

  const pending = await pool.query(
    `SELECT COUNT(*)::int AS count FROM interpretations WHERE consultation_ref = $1 AND hil_status = 'pending'`,
    [interp.consultation_ref]
  );
  if (pending.rows[0].count === 0) {
    await pool.query(
      `UPDATE consultations SET status = 'COMPLETE', report_ready = TRUE, completed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [interp.consultation_ref]
    );
  }
  await emitEvent(req.params.id, 'hil_decision', `HIL ${body.action} recorded`, {
    interpretation_id: body.interpretation_id,
    action: body.action,
  });
  res.json({
    id: review.rows[0].id,
    interpretation_id: body.interpretation_id,
    action: body.action,
    reviewer_name: review.rows[0].reviewer_name,
    reviewed_at: review.rows[0].reviewed_at,
  });
});

app.get('/consultations/:id/hil/history', async (req, res) => {
  const q = await pool.query(
    `SELECT hr.*
     FROM hil_reviews hr
     JOIN consultations c ON c.id = hr.consultation_ref
     WHERE c.consultation_id = $1
     ORDER BY hr.reviewed_at DESC`,
    [req.params.id]
  );
  res.json({ data: q.rows });
});

app.patch('/interpretations/:interpretationId/hil/:action', async (req, res) => {
  const action = req.params.action;
  if (!HIL_ACTIONS.includes(action)) return res.status(400).json({ error: 'invalid action' });
  const note = req.body?.notes || '';
  const modifiedText = req.body?.modified_text || null;
  const i = await pool.query(`SELECT * FROM interpretations WHERE id = $1`, [req.params.interpretationId]);
  if (!i.rows.length) return res.status(404).json({ error: 'Not found' });
  const interp = i.rows[0];
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified';
  await pool.query(
    `UPDATE interpretations SET hil_status=$1, hil_notes=$2, insight=COALESCE($3, insight), flagged=FALSE WHERE id=$4`,
    [status, note, modifiedText, interp.id]
  );
  res.json({ ok: true });
});

app.post('/consultations/:id/report/generate', async (req, res) => {
  const c = await pool.query(`SELECT * FROM consultations WHERE consultation_id = $1`, [req.params.id]);
  if (!c.rows.length) return res.status(404).json({ error: 'Not found' });
  const reportId = randomId('report');
  await emitEvent(req.params.id, 'agent_log', 'Report generation queued', { progress: 0.9 });
  queueOrRun('generate_report', async () => {
    await pool.query(
      `UPDATE reports r
       SET generated_at = NOW(),
           updated_at = NOW(),
           pdf_url = COALESCE(r.pdf_url, $1),
           delivery_status = 'pending'
       FROM consultations c
       WHERE c.id = r.consultation_ref AND c.consultation_id = $2`,
      [`/consultations/${req.params.id}/report.pdf`, req.params.id]
    );
    await pool.query(
      `UPDATE consultations SET report_ready = TRUE, status = 'COMPLETE', updated_at = NOW() WHERE consultation_id = $1`,
      [req.params.id]
    );
    await emitEvent(req.params.id, 'report_ready', 'Report generated', { report_id: reportId });
  });
  res.json({ report_id: reportId, status: 'generating' });
});

app.get('/consultations/:id/report', async (req, res) => {
  const q = await pool.query(
    `SELECT r.*, c.consultation_id, c.client_name, c.client_email
     FROM reports r JOIN consultations c ON c.id = r.consultation_ref
     WHERE c.consultation_id = $1`,
    [req.params.id]
  );
  if (!q.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: q.rows[0].id,
    consultation_id: q.rows[0].consultation_id,
    content: safeJsonParse(q.rows[0].content_json, {}),
    pdf_url: q.rows[0].pdf_url,
    generated_at: q.rows[0].generated_at,
    delivery_status: q.rows[0].delivery_status,
  });
});

app.get('/consultations/:id/report.pdf', (_req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'));
});

app.post('/consultations/:id/report/send-email', async (req, res) => {
  await pool.query(
    `UPDATE reports r
     SET delivery_status = 'sent', updated_at = NOW()
     FROM consultations c
     WHERE c.id = r.consultation_ref AND c.consultation_id = $1`,
    [req.params.id]
  );
  await emitEvent(req.params.id, 'agent_log', 'Report marked sent');
  res.json({ ok: true, email: req.body?.email || null });
});

app.get('/consultations/:id/jataka/daily', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const q = await pool.query(
    `SELECT jd.report_date, jd.data
     FROM jataka_daily jd JOIN consultations c ON c.id = jd.consultation_ref
     WHERE c.consultation_id = $1 AND to_char(jd.report_date, 'YYYY-MM') = $2
     ORDER BY jd.report_date ASC`,
    [req.params.id, month]
  );
  res.json({
    data: q.rows.map((r) => ({ date: r.report_date, ...safeJsonParse(r.data, {}) })),
  });
});

app.get('/consultations/:id/jataka/weekly', async (req, res) => {
  const q = await pool.query(
    `SELECT jw.week_start, jw.data
     FROM jataka_weekly jw JOIN consultations c ON c.id = jw.consultation_ref
     WHERE c.consultation_id = $1 ORDER BY jw.week_start DESC`,
    [req.params.id]
  );
  res.json({ data: q.rows.map((r) => ({ week_start: r.week_start, ...safeJsonParse(r.data, {}) })) });
});

app.get('/consultations/:id/jataka/monthly', async (req, res) => {
  const q = await pool.query(
    `SELECT jm.month_key, jm.data
     FROM jataka_monthly jm JOIN consultations c ON c.id = jm.consultation_ref
     WHERE c.consultation_id = $1 ORDER BY jm.month_key DESC`,
    [req.params.id]
  );
  res.json({ data: q.rows.map((r) => ({ month: r.month_key, ...safeJsonParse(r.data, {}) })) });
});

app.get('/consultations/:id/jataka/yearly', async (req, res) => {
  const q = await pool.query(
    `SELECT jy.year_key, jy.data
     FROM jataka_yearly jy JOIN consultations c ON c.id = jy.consultation_ref
     WHERE c.consultation_id = $1 ORDER BY jy.year_key DESC`,
    [req.params.id]
  );
  res.json({ data: q.rows.map((r) => ({ year: r.year_key, ...safeJsonParse(r.data, {}) })) });
});

app.post('/consultations/:id/jataka/generate', async (req, res) => {
  await emitEvent(req.params.id, 'agent_log', 'Jataka generation queued');
  queueOrRun('generate_jataka_daily', async () => {
    const c = await pool.query(`SELECT id FROM consultations WHERE consultation_id = $1`, [req.params.id]);
    if (!c.rows.length) return;
    await pool.query(
      `INSERT INTO jataka_daily (consultation_ref, report_date, data)
       VALUES ($1, CURRENT_DATE, $2)`,
      [c.rows[0].id, JSON.stringify({ vara: 'Tuesday', tithi: 'Ekadashi', forecast: 'Balanced day' })]
    );
    await emitEvent(req.params.id, 'jataka_ready', 'Daily Jataka generated');
  });
  res.json({ ok: true });
});

app.get('/consultations/:id/events', async (req, res) => {
  const q = await pool.query(
    `SELECT * FROM events WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [req.params.id]
  );
  res.json({ data: q.rows });
});

app.get('/consultations/:id/validate-events', async (req, res) => {
  const q = await pool.query(
    `SELECT event_type, created_at FROM events WHERE consultation_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  const eventTypes = q.rows.map((r) => r.event_type);
  const expected = ['consultation_created', 'status_change', 'interpretation_added', 'hil_decision'];
  const missing = expected.filter((e) => !eventTypes.includes(e));
  res.json({
    consultation_id: req.params.id,
    complete: missing.length === 0,
    total_events: q.rows.length,
    missing,
    event_timeline: q.rows.map((r) => `${r.created_at.toISOString()} ${r.event_type}`),
  });
});

app.get('/events/recent', async (_req, res) => {
  const q = await pool.query(`SELECT * FROM events ORDER BY created_at DESC LIMIT 100`);
  res.json({ data: q.rows });
});

app.get('/consultations/:id/events/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const timer = setInterval(async () => {
    const q = await pool.query(
      `SELECT * FROM events WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (q.rows.length) {
      res.write(`event: ${q.rows[0].event_type}\n`);
      res.write(`data: ${JSON.stringify(q.rows[0])}\n\n`);
    }
  }, 4000);
  req.on('close', () => clearInterval(timer));
});

io.on('connection', (socket) => {
  socket.join('consultations:all');
  socket.on('subscribe', ({ consultationId }) => {
    if (consultationId) socket.join(`consultation:${consultationId}`);
  });
});

async function start() {
  await migrate();
  await pool.query(
    `UPDATE interpretations
     SET confidence_score = confidence_score / 100.0
     WHERE confidence_score > 1`
  );
  await seedFromCsvIfEmpty();
  httpServer.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

