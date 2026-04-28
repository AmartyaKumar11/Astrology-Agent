const API_URL = process.env.API_URL || 'http://localhost:3000';

const concerns = ['Career', 'Finance', 'Health', 'Relations', 'Muhurta'];
const planets = ['Jupiter', 'Saturn', 'Mercury', 'Venus', 'Mars'];
const remedies = [
  'Donate green vegetables on Wednesdays.',
  'Offer water to Surya at sunrise.',
  'Recite Hanuman Chalisa on Tuesdays.',
  'Light sesame oil lamp on Saturdays.',
  'Practice mantra japa for 108 repetitions daily.',
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log('Generating live activity...');

  const created = await request('/consultations', {
    method: 'POST',
    body: JSON.stringify({
      client_name: `Live Client ${Date.now()}`,
      client_email: `live.${Date.now()}@example.com`,
      birth_data: {
        dob: '1990-05-15',
        tob: '14:30:00',
        pob: 'Mumbai',
        latitude: 19.07,
        longitude: 72.87,
        timezone: 'UTC+5:30',
      },
      concerns: ['Career', 'Finance', 'Marriage'],
    }),
  });
  console.log(`Created: ${created.consultation_id}`);

  await request(`/consultations/${created.consultation_id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'PROCESSING' }),
  });
  console.log('Status -> PROCESSING');
  await delay(500);

  const createdInterpretations = [];
  for (let i = 0; i < concerns.length; i++) {
    const concern = concerns[i];
    const flagged = concern === 'Health';
    const interp = await request('/interpretations', {
      method: 'POST',
      body: JSON.stringify({
        consultation_id: created.consultation_id,
        concern,
        insight: `Strong indicators for ${concern}.`,
        remedy: remedies[i % remedies.length],
        confidence_score: flagged ? 0.62 : 0.84,
        planet_indicator: planets[i],
        flagged,
        flag_reason: flagged ? 'Health insight requires review' : null,
      }),
    });
    createdInterpretations.push(interp);
    console.log(`Interpretation added: ${concern}`);
    await delay(300);
  }

  await request(`/consultations/${created.consultation_id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'INTERPRETING' }),
  });
  console.log('Status -> INTERPRETING');
  await delay(500);

  const pending = await request('/hil/pending');
  const targets = pending.data.filter((x) => x.consultation_id === created.consultation_id);
  for (const target of targets) {
    await request(`/consultations/${created.consultation_id}/hil/decision`, {
      method: 'POST',
      body: JSON.stringify({
        interpretation_id: target.interpretation_id,
        action: 'approve',
        reviewer_name: 'Live Reviewer',
        notes: 'Approved from activity script',
      }),
    });
    console.log(`HIL decision -> approve (${target.concern})`);
  }

  await request(`/consultations/${created.consultation_id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'COMPLETE' }),
  });
  console.log('Status -> COMPLETE');

  const events = await request(`/consultations/${created.consultation_id}/events`);
  console.log(`Done. Events emitted: ${events.data.length}`);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

