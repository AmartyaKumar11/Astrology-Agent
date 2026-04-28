import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_DATA } from '../data.js';
import { Badge, Button } from '../components/primitives.jsx';
import { IArrowLeft, IHome, IPrint } from '../components/icons.jsx';
import KundliChart from '../components/KundliChart.jsx';
import { listContainer, listItem, pageTransition } from '../components/motion.js';
import { reportService } from '../services/reportService.js';

export default function Report() {
  const { id } = useParams();
  const nav = useNavigate();
  const fallback = MOCK_DATA.find((x) => x.id === id) || MOCK_DATA[0];
  const [c, setC] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let mounted = true;
    reportService
      .getByConsultationId(id)
      .then((res) => {
        if (!mounted || !res?.content) {
          setLoading(false);
          return;
        }
        setC((prev) => ({
          ...prev,
          ...(res.content || {}),
          name: res.content.client_name || prev.name,
          reportReady: true,
        }));
        setUsingFallback(false);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setC(fallback);
        setUsingFallback(true);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <motion.div {...pageTransition} style={{ minHeight: '100vh', background: '#F3F4F6', padding: 28 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading report...</div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', background: '#F3F4F6', padding: '28px 0 80px' }}>
      <div
        className="no-print"
        style={{
          maxWidth: 880,
          margin: '0 auto 20px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Button variant="secondary" size="md" onClick={() => nav(-1)}>
          <IArrowLeft size={14} /> Back
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="md" onClick={() => nav('/')}>
            <IHome size={14} /> Desktop
          </Button>
          <Button variant="primary" size="md" onClick={() => window.print()}>
            <IPrint size={14} /> Print
          </Button>
        </div>
      </div>

      <div
        className="print-page"
        style={{
          maxWidth: 840,
          margin: '0 auto',
          background: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          borderRadius: 12,
          padding: '48px 56px',
          border: '1px solid var(--border)',
        }}
      >
        {usingFallback && (
          <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--amber-700)' }}>
            API unavailable, showing local fallback data.
          </div>
        )}
        <div style={{ textAlign: 'center', paddingBottom: 24, borderBottom: '2px solid var(--indigo)' }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.4,
              marginBottom: 6,
              color: 'var(--text)',
            }}
          >
            Jataka Patrika
          </h1>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            <b style={{ color: 'var(--text)' }}>{c.name}</b> · {c.id} · Generated{' '}
            {c.receivedAt.split(' ')[0]}
          </div>
        </div>

        <ReportSection num="1" title="Jataka Vivarana">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 16,
              background: '#FAFAFC',
              padding: 18,
              borderRadius: 10,
              border: '1px solid var(--border-soft)',
            }}
          >
            <Detail label="Date of Birth" v={c.dob} />
            <Detail label="Time of Birth" v={c.tob} />
            <Detail label="Place of Birth" v={c.pob} />
            <Detail label="Coordinates" v={c.coordinates} />
            <Detail label="Timezone" v={c.timezone} />
            <Detail label="Ayanamsa" v={c.ayanamsa} />
            <Detail label="Lagna (Ascendant)" v={c.lagna} accent />
            <Detail label="Active Mahadasha" v={c.activeMahadasha} accent />
            <Detail label="Antardasha" v={c.activeAntardasha} accent />
          </div>
        </ReportSection>

        <ReportSection num="2" title="Rasi Kundli Chart">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <KundliChart chart={c.rasiChart} size={320} lagnaSign={c.lagna} />
          </div>
        </ReportSection>

        <ReportSection num="3" title="Vimshottari Kaal">
          <DashaTimeline c={c} />
        </ReportSection>

        <ReportSection num="4" title="Yogas & Doshas">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 8,
                }}
              >
                Shubha Yogas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.yogas.length ? (
                  c.yogas.map((y) => (
                    <Badge key={y} tone="emerald" dot>
                      {y}
                    </Badge>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>None detected</span>
                )}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 8,
                }}
              >
                Dosha Vichar
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.doshas.length ? (
                  c.doshas.map((d) => (
                    <Badge key={d} tone="amber" dot>
                      {d}
                    </Badge>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>None detected</span>
                )}
              </div>
            </div>
          </div>
        </ReportSection>

        <ReportSection num="5" title="Jeevan Margdarshan">
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {Object.entries(c.interpretations).map(([k, v]) => (
              <motion.div
                key={k}
                variants={listItem}
                style={{
                  padding: 14,
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
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize' }}>{k}</div>
                  <Badge tone={v.confidence >= 75 ? 'emerald' : v.confidence >= 50 ? 'amber' : 'rose'}>
                    {v.confidence}%
                  </Badge>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#374151' }}>{v.insight}</div>
              </motion.div>
            ))}
          </motion.div>
        </ReportSection>

        <ReportSection num="6" title="Upaya">
          <div
            style={{
              padding: 16,
              background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
              border: '1px solid var(--indigo-100)',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.65,
              color: '#374151',
            }}
          >
            {c.remedy}
          </div>
        </ReportSection>

        <ReportSection num="7" title="Shubha Muhurta">
          <div style={{ fontSize: 13, lineHeight: 1.65, color: '#374151' }}>
            {c.interpretations.muhurta.insight}
          </div>
        </ReportSection>

        <div
          style={{
            marginTop: 32,
            paddingTop: 18,
            borderTop: '1px solid var(--border)',
            fontStyle: 'italic',
            fontSize: 11.5,
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          This report has been reviewed by a certified Jyotishi. Astrological guidance is offered for
          reflection and is not a substitute for medical, financial, or legal counsel.
        </div>
      </div>
    </motion.div>
  );
}

function ReportSection({ num, title, children }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'var(--indigo)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {num}
        </div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, v, accent }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
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
          fontSize: 13,
          fontWeight: 600,
          color: accent ? 'var(--indigo-700)' : 'var(--text)',
          marginTop: 3,
        }}
      >
        {v}
      </div>
    </div>
  );
}

function DashaTimeline({ c }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: 34,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div style={{ flex: 1.5, background: '#E5E7EB' }} />
        <div
          style={{
            flex: 2.4,
            background: 'var(--indigo)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: 11,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          {`${c.activeMahadasha} · ${c.activeAntardasha}`}
        </div>
        <div style={{ flex: 1.6, background: '#E5E7EB' }} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: 'var(--muted)',
          marginTop: 6,
        }}
      >
        <span>—</span>
        <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>Today</span>
        <span>Ends {c.dashaEnds}</span>
      </div>
    </div>
  );
}
