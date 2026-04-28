import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_DATA } from '../data.js';
import { AgentChip, Button, ConfidenceBar, PageHeader } from '../components/primitives.jsx';
import { IArrowRight, IClock } from '../components/icons.jsx';
import { listContainer, listItem, pageTransition } from '../components/motion.js';
import { consultationService } from '../services/consultationService.js';

export default function HILBoard() {
  const nav = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let mounted = true;
    consultationService
      .list()
      .then((res) => {
        if (!mounted) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (!rows.length) {
          setConsultations([]);
          setLoading(false);
          return;
        }
        const merged = rows.map((r) => ({
          ...(MOCK_DATA.find((x) => x.id === (r.consultation_id || r.id)) || {}),
          id: r.consultation_id || r.id,
          name: r.client_name || r.name || 'Unknown',
          email: r.client_email || r.email || '',
          status: r.status || 'PROCESSING',
          waitingMin: r.waiting_min ?? 0,
          overallConfidence: Math.round((r.overall_confidence ?? 0.75) * 100),
          interpretations: r.interpretations || {},
        }));
        setConsultations(merged);
        setUsingFallback(false);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setConsultations(MOCK_DATA);
        setUsingFallback(true);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const pending = consultations.filter((c) => c.status === 'HIL_PENDING');
  const review = consultations.filter((c) => c.status === 'INTERPRETING');
  const resolved = consultations.filter((c) => c.status === 'COMPLETE');

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      <PageHeader title="Drishti Board" subtitle="Jyotishi review queue" right={<AgentChip />} />

      <div style={{ padding: '24px 28px', maxWidth: 1600, margin: '0 auto' }}>
        {usingFallback && (
          <div style={{ fontSize: 12, color: 'var(--amber-700)', marginBottom: 10 }}>
            API unavailable, showing local fallback data.
          </div>
        )}
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading Drishti board...</div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          <Column tone="amber" title="Vichaaradheen" count={pending.length} subtitle="Awaiting Jyotishi">
            {pending.map((c) => (
              <KanbanCard key={c.id} c={c} pulse onOpen={() => nav(`/consultation/${c.id}`)} />
            ))}
            {!pending.length && <Empty>No pending consultations</Empty>}
          </Column>

          <Column tone="indigo" title="Drishti Mein" count={review.length} subtitle="In progress">
            {review.map((c) => (
              <KanbanCard key={c.id} c={c} onOpen={() => nav(`/consultation/${c.id}`)} />
            ))}
            {!review.length && <Empty>No active reviews</Empty>}
          </Column>

          <Column tone="emerald" title="Nirnay" count={resolved.length} subtitle="Cleared & delivered">
            {resolved.map((c) => (
              <KanbanCard key={c.id} c={c} resolved onOpen={() => nav(`/consultation/${c.id}`)} />
            ))}
            {!resolved.length && <Empty>None resolved yet</Empty>}
          </Column>
        </div>
        )}
      </div>
    </motion.div>
  );
}

function Column({ tone, title, count, subtitle, children }) {
  const map = {
    amber:   { bg: 'var(--amber-50)',   bd: 'var(--amber-100)',   fg: 'var(--amber-700)',   dot: 'var(--amber)' },
    indigo:  { bg: 'var(--indigo-50)',  bd: 'var(--indigo-100)',  fg: 'var(--indigo-700)',  dot: 'var(--indigo)' },
    emerald: { bg: 'var(--emerald-50)', bd: 'var(--emerald-100)', fg: 'var(--emerald-700)', dot: 'var(--emerald)' },
  }[tone];
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 480,
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          background: map.bg,
          borderBottom: `1px solid ${map.bd}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: map.dot }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: map.fg,
              letterSpacing: 0.2,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{subtitle}</div>
        </div>
        <div
          style={{
            minWidth: 24,
            height: 24,
            padding: '0 8px',
            borderRadius: 999,
            background: '#fff',
            color: map.fg,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${map.bd}`,
          }}
        >
          {count}
        </div>
      </div>
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function KanbanCard({ c, pulse, resolved, onOpen }) {
  const reasons = Object.entries(c.interpretations)
    .filter(([, v]) => v.flagged)
    .map(([k, v]) => ({ key: k, reason: v.flagReason }));

  return (
    <motion.div
      variants={listItem}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className={pulse ? 'pulse-border' : ''}
      style={{
        border: '1px solid var(--border)',
        borderLeft: pulse
          ? '3px solid var(--amber)'
          : resolved
            ? '3px solid var(--emerald)'
            : '3px solid var(--indigo)',
        borderRadius: 10,
        padding: 14,
        background: '#fff',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}
        >
          <IClock size={12} />
          {c.waitingMin > 0 ? `${c.waitingMin}m` : 'just now'}
        </div>
      </div>

      {reasons.length ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reasons.slice(0, 2).map((r) => (
            <div
              key={r.key}
              style={{
                fontSize: 11.5,
                padding: '6px 8px',
                background: 'var(--amber-50)',
                border: '1px solid var(--amber-100)',
                borderRadius: 6,
                color: 'var(--amber-700)',
              }}
            >
              <b style={{ textTransform: 'capitalize' }}>{r.key}:</b> {r.reason}
            </div>
          ))}
        </div>
      ) : resolved ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: 'var(--emerald-700)',
            padding: '6px 8px',
            background: 'var(--emerald-50)',
            border: '1px solid var(--emerald-100)',
            borderRadius: 6,
          }}
        >
          ✓ All sections cleared · Report delivered
        </div>
      ) : null}

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            Confidence
          </div>
          <ConfidenceBar value={c.overallConfidence} height={5} />
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="sm"
          variant={pulse ? 'warning' : 'secondary'}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Review <IArrowRight size={12} />
        </Button>
      </div>
    </motion.div>
  );
}

function Empty({ children }) {
  return (
    <div
      style={{
        padding: '30px 14px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--muted-2)',
        border: '1.5px dashed var(--border)',
        borderRadius: 10,
      }}
    >
      {children}
    </div>
  );
}
