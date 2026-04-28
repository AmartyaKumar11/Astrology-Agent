import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { IArrowRight, IDoc, IX } from '../components/icons.jsx';
import KundliChart from '../components/KundliChart.jsx';
import {
  listContainer,
  listItem,
  modalCard,
  modalOverlay,
  pageTransition,
} from '../components/motion.js';

export default function Queue() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('ALL'); // ALL | PROCESSING | HIL | COMPLETE
  const [modalId, setModalId] = useState(null);

  const counts = MOCK_DATA.reduce(
    (a, c) => {
      a.total++;
      if (c.status === 'PROCESSING' || c.status === 'INTERPRETING') a.processing++;
      if (c.status === 'HIL_PENDING') a.hil++;
      if (c.status === 'COMPLETE') a.complete++;
      return a;
    },
    { total: 0, processing: 0, hil: 0, complete: 0 }
  );

  const filtered = MOCK_DATA.filter((c) => {
    if (filter === 'ALL') return true;
    if (filter === 'PROCESSING') return c.status === 'PROCESSING' || c.status === 'INTERPRETING';
    if (filter === 'HIL') return c.status === 'HIL_PENDING';
    if (filter === 'COMPLETE') return c.status === 'COMPLETE';
    return true;
  });

  const subtitleMap = {
    ALL: 'All Jatakas',
    PROCESSING: 'Currently being processed',
    HIL: 'Awaiting Jyotishi review',
    COMPLETE: 'Delivered Patrikas',
  };

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      <PageHeader title="Jataka Queue" subtitle={subtitleMap[filter]} right={<AgentChip />} />

      <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto' }}>
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}
        >
          <StatCard
            label="Total Received"
            value={counts.total}
            tone="indigo"
            active={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
          />
          <StatCard
            label="Processing"
            value={counts.processing}
            tone="blue"
            active={filter === 'PROCESSING'}
            onClick={() => setFilter('PROCESSING')}
          />
          <StatCard
            label="Awaiting Jyotishi"
            value={counts.hil}
            tone="amber"
            sub="awaiting astrologer"
            active={filter === 'HIL'}
            onClick={() => setFilter('HIL')}
          />
          <StatCard
            label="Completed"
            value={counts.complete}
            tone="emerald"
            active={filter === 'COMPLETE'}
            onClick={() => setFilter('COMPLETE')}
          />
        </motion.div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1.4fr 130px 1.2fr 130px 200px 160px',
              background: '#FAFAFB',
              borderBottom: '1px solid var(--border)',
              padding: '12px 18px',
              gap: 14,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            <div>ID</div>
            <div>Jataka</div>
            <div>Received</div>
            <div>Concerns</div>
            <div>Stage</div>
            <div>Confidence</div>
            <div />
          </div>
          {filtered.length ? (
            <motion.div key={filter} variants={listContainer} initial="hidden" animate="show">
              {filtered.map((c, i) => (
                <QueueRow
                  key={c.id}
                  c={c}
                  last={i === filtered.length - 1}
                  onOpen={() => nav(`/consultation/${c.id}`)}
                  onViewReport={() => setModalId(c.id)}
                  completedView={filter === 'COMPLETE'}
                />
              ))}
            </motion.div>
          ) : (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>
              No consultations match this filter.
            </div>
          )}
        </Card>
      </div>

      <AnimatePresence>
        {modalId && (
          <ReportModal
            id={modalId}
            onClose={() => setModalId(null)}
            onOpenFull={() => {
              const id = modalId;
              setModalId(null);
              nav(`/report/${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ label, value, sub, tone = 'indigo', active, onClick }) {
  const map = {
    indigo:  { c: 'var(--indigo)',  bg: 'var(--indigo-50)',  bd: 'var(--indigo-100)' },
    blue:    { c: 'var(--blue)',    bg: 'var(--blue-50)',    bd: 'var(--blue-100)' },
    amber:   { c: 'var(--amber)',   bg: 'var(--amber-50)',   bd: 'var(--amber-100)' },
    emerald: { c: 'var(--emerald)', bg: 'var(--emerald-50)', bd: 'var(--emerald-100)' },
  }[tone];
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      variants={listItem}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: active ? map.bg : '#fff',
        border: '1px solid ' + (active ? map.c : hover ? map.bd : 'var(--border)'),
        borderRadius: 'var(--radius)',
        padding: 18,
        boxShadow: hover || active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'background .15s, border-color .15s, box-shadow .15s',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        {active && <span style={{ width: 6, height: 6, borderRadius: 999, background: map.c }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: map.c, letterSpacing: -0.5 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>
      </div>
    </motion.button>
  );
}

function QueueRow({ c, last, onOpen, onViewReport, completedView }) {
  const [hover, setHover] = useState(false);
  const isHil = c.status === 'HIL_PENDING';
  const isComplete = c.status === 'COMPLETE';
  const handleRowClick = () => {
    if (completedView && isComplete) onViewReport();
    else onOpen();
  };
  return (
    <motion.div
      variants={listItem}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleRowClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1.4fr 130px 1.2fr 130px 200px 160px',
        padding: '14px 18px',
        gap: 14,
        alignItems: 'center',
        cursor: 'pointer',
        background: hover ? '#FAFAFC' : '#fff',
        borderBottom: last ? 'none' : '1px solid var(--border-soft)',
        borderLeft: isHil
          ? '3px solid var(--amber)'
          : isComplete && completedView
            ? '3px solid var(--emerald)'
            : '3px solid transparent',
        transition: 'background .12s',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
        {c.id}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{c.email}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{relativeTime(c.receivedAt)}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {c.concerns.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#F3F4F6',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div>
        <StatusBadge status={c.status} />
      </div>
      <div>
        <ConfidenceBar value={c.overallConfidence} />
      </div>
      <div style={{ textAlign: 'right' }}>
        {completedView && isComplete ? (
          <Button
            size="sm"
            variant="success"
            onClick={(e) => {
              e.stopPropagation();
              onViewReport();
            }}
          >
            <IDoc size={12} /> View Patrika
          </Button>
        ) : (
          <Button
            size="sm"
            variant={isHil ? 'warning' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            Open <IArrowRight size={12} />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function ReportModal({ id, onClose, onOpenFull }) {
  const c = MOCK_DATA.find((x) => x.id === id);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  if (!c) return null;
  return (
    <motion.div
      {...modalOverlay}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(17,24,39,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 20px',
        overflowY: 'auto',
      }}
    >
      <motion.div
        {...modalCard}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 880,
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: '#FAFBFC',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--indigo-50)',
              color: 'var(--indigo)',
              border: '1px solid var(--indigo-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IDoc size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Consultation Report</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {c.name} · {c.id}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={onOpenFull}>
            Open full page <IArrowRight size={12} />
          </Button>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            <IX size={14} />
          </button>
        </div>
        <div style={{ padding: '28px 36px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
          <ReportInline c={c} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReportInline({ c }) {
  return (
    <div>
      <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '2px solid var(--indigo)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, margin: '10px 0 4px' }}>
          Jataka Patrika
        </h2>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          <b style={{ color: 'var(--text)' }}>{c.name}</b> · {c.id} · Generated{' '}
          {c.receivedAt.split(' ')[0]}
        </div>
      </div>

      <MiniReportSection num="1" title="Jataka Vivarana">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 14,
            background: '#FAFAFC',
            padding: 14,
            borderRadius: 10,
            border: '1px solid var(--border-soft)',
          }}
        >
          <MiniDetail label="DOB" v={c.dob} />
          <MiniDetail label="TOB" v={c.tob} />
          <MiniDetail label="POB" v={c.pob} />
          <MiniDetail label="Coordinates" v={c.coordinates} />
          <MiniDetail label="Timezone" v={c.timezone} />
          <MiniDetail label="Ayanamsa" v={c.ayanamsa} />
          <MiniDetail label="Lagna" v={c.lagna} accent />
          <MiniDetail label="Mahadasha" v={c.activeMahadasha} accent />
          <MiniDetail label="Antardasha" v={c.activeAntardasha} accent />
        </div>
      </MiniReportSection>

      <MiniReportSection num="2" title="Rasi Kundli Chart">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <KundliChart chart={c.rasiChart} size={280} lagnaSign={c.lagna} />
        </div>
      </MiniReportSection>

      <MiniReportSection num="3" title="Yogas & Doshas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 6,
              }}
            >
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
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>None</span>
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 6,
              }}
            >
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
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>None</span>
              )}
            </div>
          </div>
        </div>
      </MiniReportSection>

      <MiniReportSection num="4" title="Jeevan Margdarshan">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(c.interpretations).map(([k, v]) => (
            <div
              key={k}
              style={{
                padding: 12,
                border: '1px solid var(--border-soft)',
                borderRadius: 10,
                background: '#FCFCFD',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{k}</div>
                <Badge tone={v.confidence >= 75 ? 'emerald' : v.confidence >= 50 ? 'amber' : 'rose'}>
                  {v.confidence}%
                </Badge>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#374151' }}>{v.insight}</div>
            </div>
          ))}
        </div>
      </MiniReportSection>

      <MiniReportSection num="5" title="Upaya">
        <div
          style={{
            padding: 14,
            background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
            border: '1px solid var(--indigo-100)',
            borderRadius: 10,
            fontSize: 12.5,
            lineHeight: 1.6,
            color: '#374151',
          }}
        >
          {c.remedy}
        </div>
      </MiniReportSection>

      <div
        style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid var(--border)',
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--muted)',
          lineHeight: 1.55,
        }}
      >
        This report has been reviewed by a certified human astrologer. Not a substitute for medical,
        financial, or legal counsel.
      </div>
    </div>
  );
}

function MiniReportSection({ num, title, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: 'var(--indigo)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {num}
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MiniDetail({ label, v, accent }) {
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
          fontSize: 12.5,
          fontWeight: 600,
          color: accent ? 'var(--indigo-700)' : 'var(--text)',
          marginTop: 2,
        }}
      >
        {v}
      </div>
    </div>
  );
}

function relativeTime(ts) {
  const d = new Date(ts.replace(' ', 'T'));
  if (isNaN(d)) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
