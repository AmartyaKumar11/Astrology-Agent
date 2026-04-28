import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CONCERNS = ['Career', 'Finance', 'Health', 'Relations', 'Muhurta'];

async function geocodePlace(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Geocode request failed');
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error('Place not found');
  return {
    latitude: Number(data[0].lat),
    longitude: Number(data[0].lon),
  };
}

export default function DataIntake() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    tob: '',
    pob: '',
    latitude: '',
    longitude: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    concerns: [],
    questions: '',
  });

  const patch = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const detectCoordinates = async (place) => {
    if (!place || String(place).trim().length < 2) return;
    setGeoLoading(true);
    try {
      const g = await geocodePlace(place);
      patch('latitude', g.latitude.toFixed(4));
      patch('longitude', g.longitude.toFixed(4));
      setError('');
    } catch (e) {
      setError(`Unable to detect coordinates for "${place}". Please refine place name.`);
    } finally {
      setGeoLoading(false);
    }
  };

  const validate = () => {
    if (step === 1) return !!form.name && !!form.email;
    if (step === 2) return !!form.dob && !!form.tob && !!form.pob;
    if (step === 3) return form.concerns.length > 0;
    return true;
  };

  const next = async () => {
    if (!validate()) {
      setError('Please complete required fields.');
      return;
    }
    if (step === 2 && (!form.latitude || !form.longitude)) {
      try {
        const g = await geocodePlace(form.pob);
        patch('latitude', g.latitude.toFixed(4));
        patch('longitude', g.longitude.toFixed(4));
      } catch (e) {
        setError(`Unable to detect coordinates for "${form.pob}". Please check place name.`);
        return;
      }
    }
    setError('');
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = async () => {
    if (!validate()) {
      setError('Please select at least one concern.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let latitude = Number(form.latitude);
      let longitude = Number(form.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const g = await geocodePlace(form.pob);
        latitude = g.latitude;
        longitude = g.longitude;
        patch('latitude', g.latitude.toFixed(4));
        patch('longitude', g.longitude.toFixed(4));
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/consultations/create-and-compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          dob: form.dob,
          tob: form.tob,
          pob: form.pob,
          latitude,
          longitude,
          timezone: form.timezone,
          concerns: form.concerns,
          questions: form.questions,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Submission failed');
      nav(`/consultation/${out.consultation_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(165deg,#EEF2FF 0%, #F8FAFC 55%, #EEF2FF 100%)',
        padding: 24,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: '8px 0 4px', letterSpacing: -0.6 }}>New Consultation</h1>
        <div style={{ color: 'var(--muted)', marginBottom: 16, fontWeight: 600 }}>Step {step} of 3</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                width: 46,
                height: 8,
                borderRadius: 999,
                background: n <= step ? 'var(--indigo)' : '#E5E7EB',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>
        {!!error && (
          <div
            style={{
              marginBottom: 12,
              color: '#991B1B',
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              padding: 10,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 18px 36px rgba(30,41,59,0.10)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {step === 1 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <input style={fieldStyle} placeholder="Full Name *" value={form.name} onChange={(e) => patch('name', e.target.value)} />
              <input style={fieldStyle} placeholder="Email *" value={form.email} onChange={(e) => patch('email', e.target.value)} />
              <input style={fieldStyle} placeholder="Phone (optional)" value={form.phone} onChange={(e) => patch('phone', e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <input style={fieldStyle} type="date" value={form.dob} onChange={(e) => patch('dob', e.target.value)} />
              <input style={fieldStyle} type="time" value={form.tob} onChange={(e) => patch('tob', e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...fieldStyle, flex: 1 }}
                  placeholder="Place of Birth *"
                  value={form.pob}
                  onChange={(e) => {
                    patch('pob', e.target.value);
                    patch('latitude', '');
                    patch('longitude', '');
                  }}
                  onBlur={() => detectCoordinates(form.pob)}
                />
                <button
                  style={primaryBtn}
                  onClick={async () => {
                    await detectCoordinates(form.pob);
                  }}
                >
                  {geoLoading ? 'Detecting...' : 'Detect'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ ...fieldStyle, background: '#F8FAFC' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>Latitude: </span>
                  <span style={{ fontWeight: 600 }}>{form.latitude || (geoLoading ? 'Detecting...' : '—')}</span>
                </div>
                <div style={{ ...fieldStyle, background: '#F8FAFC' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>Longitude: </span>
                  <span style={{ fontWeight: 600 }}>{form.longitude || (geoLoading ? 'Detecting...' : '—')}</span>
                </div>
              </div>
              <input style={fieldStyle} placeholder="Timezone" value={form.timezone} onChange={(e) => patch('timezone', e.target.value)} />
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CONCERNS.map((c) => {
                  const active = form.concerns.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        patch(
                          'concerns',
                          active ? form.concerns.filter((x) => x !== c) : [...form.concerns, c]
                        )
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid ' + (active ? 'var(--indigo)' : 'var(--border)'),
                        background: active ? 'var(--indigo)' : '#fff',
                        color: active ? '#fff' : 'var(--text)',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <textarea
                style={fieldStyle}
                rows={4}
                placeholder="Specific questions (optional)"
                value={form.questions}
                onChange={(e) => patch('questions', e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button style={secondaryBtn} onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            Back
          </button>
          {step < 3 ? (
            <button style={primaryBtn} onClick={next}>Next</button>
          ) : (
            <button style={primaryBtn} onClick={submit} disabled={loading}>
              {loading ? 'Submitting...' : 'Get Reading'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const fieldStyle = {
  width: '100%',
  border: '1px solid #CBD5E1',
  borderRadius: 10,
  background: '#fff',
  color: '#0F172A',
  fontSize: 14,
  padding: '10px 12px',
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtn = {
  border: '1px solid #4338CA',
  background: 'linear-gradient(135deg,#4F46E5,#4338CA)',
  color: '#fff',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  padding: '9px 14px',
  cursor: 'pointer',
};

const secondaryBtn = {
  border: '1px solid #CBD5E1',
  background: '#fff',
  color: '#334155',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  padding: '9px 14px',
  cursor: 'pointer',
};
