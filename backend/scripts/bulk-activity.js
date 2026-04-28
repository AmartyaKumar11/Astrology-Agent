const API_URL = process.env.API_URL || 'http://localhost:3000';
const COUNT = Number(process.env.COUNT || 10);

const names = [
  'Anil Gandhi',
  'Devyani Joshi',
  'Sachin Shah',
  'Raksha Mehta',
  'Vikram Rastogi',
];
const statuses = ['QUEUED', 'PROCESSING', 'INTERPRETING', 'HIL_PENDING', 'COMPLETE'];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function run() {
  console.log(`Creating ${COUNT} consultations...`);
  for (let i = 0; i < COUNT; i++) {
    const created = await request('/consultations', {
      method: 'POST',
      body: JSON.stringify({
        client_name: `${names[i % names.length]} #${Date.now().toString().slice(-4)}${i}`,
        client_email: `bulk${Date.now()}_${i}@example.com`,
        birth_data: {
          dob: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
          tob: `${(8 + (i % 10)).toString().padStart(2, '0')}:30:00`,
          pob: 'Delhi',
          latitude: 28.61,
          longitude: 77.21,
          timezone: 'UTC+5:30',
        },
        concerns: ['Career', 'Finance'],
      }),
    });

    const status = statuses[i % statuses.length];
    await request(`/consultations/${created.consultation_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    console.log(`[${i + 1}/${COUNT}] ${created.consultation_id} -> ${status}`);
    await delay(150);
  }

  const list = await request('/consultations?limit=5');
  console.log(`Bulk done. Sample returned rows: ${list.data.length}`);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

