import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MOCK_DATA } from '../data.js';
import {
  AgentChip,
  Badge,
  Button,
  Card,
  ConfidenceBar,
  PageHeader,
  StatusBadge,
} from '../components/primitives.jsx';
import { ICheck, ICircleUser, IDoc, IFlag, IShield, ITerminal } from '../components/icons.jsx';
import KundliChart from '../components/KundliChart.jsx';
import JatakaReportsSection from '../components/JatakaReportsSection.jsx';
import {
  listContainer,
  listItem,
  pageTransition,
  slideUp,
} from '../components/motion.js';

export default function Consultation() {
  const { id } = useParams();
  const nav = useNavigate();
  const base = MOCK_DATA.find((c) => c.id === id) || MOCK_DATA[0];

  const [c, setC] = useState(() => JSON.parse(JSON.stringify(base)));
  useEffect(() => {
    setC(JSON.parse(JSON.stringify(base)));
  }, [id]);

  const [logShown, setLogShown] = useState(() => {
    if (base.status === 'COMPLETE') return base.agentLog.length;
    return Math.max(1, Math.min(2, base.agentLog.length));
  });

  useEffect(() => {
    if (logShown >= c.agentLog.length) return;
    const t = setTimeout(() => setLogShown((n) => n + 1), 5000);
    return () => clearTimeout(t);
  }, [logShown, c.agentLog.length]);

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logShown]);

  const isWorking = c.status !== 'COMPLETE' && logShown >= c.agentLog.length && c.status !== 'HIL_PENDING';
  const stillStreaming = logShown < c.agentLog.length;

  const [toastVisible, setToastVisible] = useState(false);
  const handleConsult = () => setToastVisible(true);
  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      <PageHeader
        title={`Workspace · ${c.name}`}
        subtitle={`${c.id} · received ${c.receivedAt}`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={c.status} />
            {c.reportReady && (
              <Button size="sm" variant="secondary" onClick={() => nav(`/report/${c.id}`)}>
                <IDoc size={14} /> View Patrika
              </Button>
            )}
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 30%) 1fr',
          gap: 20,
          padding: '20px 28px',
          maxWidth: 1600,
          margin: '0 auto',
          alignItems: 'start',
        }}
      >
        <Card
          style={{
            position: 'sticky',
            top: 20,
            height: 'calc(100vh - 180px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#0F172A',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ITerminal size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Live Activity</div>
            </div>
          </div>
          <div
            ref={logRef}
            style={{ flex: 1, overflowY: 'auto', padding: '10px 8px 14px', background: '#FBFBFD' }}
          >
            {c.agentLog.slice(0, logShown).map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
            {(stillStreaming || isWorking) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  color: 'var(--muted)',
                  fontSize: 12,
                }}
              >
                <span
                  className="spin"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    border: '2px solid #E5E7EB',
                    borderTopColor: 'var(--indigo)',
                    display: 'inline-block',
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {initials(c.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.2 }}>{c.name}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {c.id}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {c.email} · received {c.receivedAt}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5,1fr)',
                gap: 10,
                marginTop: 16,
                paddingTop: 14,
                borderTop: '1px solid var(--border-soft)',
              }}
            >
              <Fact label="DOB" v={c.dob} />
              <Fact label="TOB" v={c.tob} />
              <Fact label="POB" v={c.pob} />
              <Fact label="Ayanamsa" v={c.ayanamsa} />
              <Fact label="Lagna" v={c.lagna} accent />
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,400px) 1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card style={{ padding: 16 }}>
                <Section title="Rasi Chart" />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                  <KundliChart chart={c.rasiChart} size={320} lagnaSign={c.lagna} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12,
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'var(--muted)',
                  }}
                >
                  {[
                    ['Su', 'Sun'],
                    ['Mo', 'Moon'],
                    ['Ma', 'Mars'],
                    ['Me', 'Mercury'],
                    ['Ju', 'Jupiter'],
                    ['Ve', 'Venus'],
                    ['Sa', 'Saturn'],
                    ['Ra', 'Rahu'],
                    ['Ke', 'Ketu'],
                  ].map(([a, n]) => (
                    <span key={a}>
                      {a}
                      <span style={{ color: '#9CA3AF' }}>·{n}</span>
                    </span>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: 16 }}>
                <Section title="Active Dasha" />
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: 12,
                    marginTop: 8,
                    background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                    border: '1px solid var(--indigo-100)',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Mahadasha
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--indigo-700)' }}>
                      {c.activeMahadasha}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Antardasha
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--indigo-700)' }}>
                      {c.activeAntardasha}
                    </div>
                  </div>
                  <div style={{ flex: 1.2 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Ends
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.dashaEnds}</div>
                  </div>
                </div>
              </Card>

              <Card style={{ padding: 16 }}>
                <Section title="Yogas & Doshas" />
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>
                    Yogas
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.yogas.length ? (
                      c.yogas.map((y) => (
                        <Badge key={y} tone="emerald" dot>
                          {y}
                        </Badge>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>None detected</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>
                    Doshas
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.doshas.length ? (
                      c.doshas.map((d) => (
                        <Badge key={d} tone="amber" dot>
                          {d}
                        </Badge>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>None detected</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <Section title="Interpretations" sub="Five concern domains" />
              {Object.entries(c.interpretations).map(([k, v]) => (
                <InterpretationCard key={k} domain={k} v={v} />
              ))}
            </motion.div>
          </div>

          <JatakaReportsSection c={c} />

          <AnimatePresence>
            {Object.values(c.interpretations).some((v) => v.flagged) && (
              <HILPanel c={c} onConsult={handleConsult} />
            )}
          </AnimatePresence>

        </div>
      </div>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#4F46E5',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <ICheck size={14} />
            Sent to Jyotishi for review
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function initials(n) {
  return n
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

function Fact({ label, v, accent }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          color: 'var(--muted)',
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: accent ? 'var(--indigo)' : 'var(--text)',
          marginTop: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {v}
      </div>
    </div>
  );
}

function Section({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

function LogEntry({ entry }) {
  const colors = {
    INFO:      { left: 'var(--blue)',    badge: 'var(--blue-50)',    fg: '#1D4ED8' },
    SUCCESS:   { left: 'var(--emerald)', badge: 'var(--emerald-50)', fg: 'var(--emerald-700)' },
    WARNING:   { left: 'var(--amber)',   badge: 'var(--amber-50)',   fg: 'var(--amber-700)' },
    FLAGGED:   { left: 'var(--rose)',    badge: 'var(--rose-50)',    fg: 'var(--rose-700)' },
    ROUTED:    { left: 'var(--purple)',  badge: 'var(--purple-50)',  fg: '#6D28D9' },
  }[entry.type] || { left: '#9CA3AF', badge: '#F3F4F6', fg: '#374151' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        display: 'flex',
        gap: 10,
        padding: '8px 10px 8px 12px',
        borderLeft: `3px solid ${colors.left}`,
        background: '#fff',
        borderRadius: 6,
        margin: '6px 4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--muted)', minWidth: 60 }}>
        {entry.time}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.6,
            background: colors.badge,
            color: colors.fg,
            padding: '1px 6px',
            borderRadius: 4,
            marginBottom: 3,
          }}
        >
          {entry.type}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text)' }}>{entry.message}</div>
      </div>
    </motion.div>
  );
}

function InterpretationCard({ domain, v }) {
  const titleMap = {
    career: 'Career',
    finance: 'Finance',
    health: 'Health',
    relations: 'Relations',
    muhurta: 'Muhurta',
  };
  let statusBadge;
  if (v.hilStatus === 'APPROVED')
    statusBadge = (
      <Badge tone="emerald" dot>
        APPROVED ✓
      </Badge>
    );
  else if (v.hilStatus === 'MODIFIED')
    statusBadge = (
      <Badge tone="indigo" dot>
        MODIFIED
      </Badge>
    );
  else if (v.hilStatus === 'REJECTED')
    statusBadge = (
      <Badge tone="rose" dot>
        REJECTED
      </Badge>
    );
  else if (v.flagged)
    statusBadge = (
      <span className="blink">
        <Badge tone="amber" dot>
          DRISHTI PENDING
        </Badge>
      </span>
    );
  else
    statusBadge = (
      <Badge tone="emerald" dot>
        CLEARED
      </Badge>
    );

  return (
    <motion.div
      variants={listItem}
      layout
      style={{
        padding: 14,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {titleMap[domain] || domain}
        </div>
        {statusBadge}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: '#374151', marginTop: 10 }}>{v.insight}</div>
      {v.flagged && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'var(--amber-50)',
            border: '1px solid var(--amber-100)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--amber-700)',
            display: 'flex',
            gap: 8,
          }}
        >
          <IFlag size={14} />
          <div>
            <b>Flag reason:</b> {v.flagReason}
          </div>
        </div>
      )}
      {v.hilNote && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            background: '#F9FAFB',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 11.5,
            color: 'var(--muted)',
          }}
        >
          <b style={{ color: '#374151' }}>Jyotishi note:</b> {v.hilNote}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <ConfidenceBar value={v.confidence} />
      </div>
    </motion.div>
  );
}

function HILPanel({ c, onConsult }) {
  const flagged = Object.entries(c.interpretations).filter(([, v]) => v.flagged);

  return (
    <motion.div
      layout
      {...slideUp}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        padding: 0,
        overflow: 'hidden',
        borderTop: '4px solid var(--amber)',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(180deg,#FFFBEB,#FFFFFF)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--amber-50)',
            color: 'var(--amber-700)',
            border: '1px solid var(--amber-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IShield size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Requires Jyotishi Review</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {flagged.length} section{flagged.length !== 1 ? 's' : ''} routed to Jyotishi
          </div>
        </div>
        <Badge tone="amber" dot>
          Awaiting review
        </Badge>
      </div>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {flagged.map(([key, v]) => (
          <motion.div
            key={key}
            variants={listItem}
            layout
            style={{
              border: '1px solid var(--amber-100)',
              background: '#FFFEF8',
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IFlag size={14} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{key}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>· confidence {v.confidence}%</span>
            </div>

            <div style={{ fontSize: 13, lineHeight: 1.55, color: '#374151' }}>{v.insight}</div>

            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--amber-700)',
                padding: '6px 10px',
                background: 'var(--amber-50)',
                borderRadius: 6,
              }}
            >
              <b>Reason:</b> {v.flagReason}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={onConsult}
              style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
            >
              <ICircleUser size={14} /> Consult with Jyotishi
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
