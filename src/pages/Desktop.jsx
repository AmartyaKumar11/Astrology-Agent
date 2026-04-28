import { motion } from 'framer-motion';
import { MOCK_DATA } from '../data.js';
import { ISparkle } from '../components/icons.jsx';
import { pageTransition } from '../components/motion.js';

export default function Desktop() {
  const hilPending = MOCK_DATA.filter((c) => c.status === 'HIL_PENDING').length;
  const today = MOCK_DATA.length;

  return (
    <motion.div
      {...pageTransition}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: "url('/wallpaper.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(30,27,75,0.35) 0%, rgba(67,56,202,0.20) 55%, rgba(167,139,250,0.15) 100%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 300,
          padding: 18,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.20)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ISparkle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Vedic Astrology Agent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                className="pulse-dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: 'var(--emerald)',
                  color: 'var(--emerald)',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--emerald-700)', fontWeight: 600, letterSpacing: 0.4 }}>
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
          <Stat label="Consultations today" value={today} />
          <Stat label="Awaiting Jyotishi" value={hilPending} tone={hilPending ? 'amber' : 'emerald'} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, tone = 'neutral' }) {
  const fg = tone === 'emerald' ? 'var(--emerald-700)' : tone === 'amber' ? 'var(--amber-700)' : 'var(--text)';
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.4,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: fg, marginTop: 2 }}>{value}</div>
    </div>
  );
}

