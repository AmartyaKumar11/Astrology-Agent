import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { JATAKA_REPORTS } from '../data.js';
import { Card } from './primitives.jsx';
import { IArrowLeft, IArrowRight } from './icons.jsx';

const COLOUR_MAP = {
  White: '#FFFFFF',
  Cream: '#FFF8E7',
  Pink: '#FFC0CB',
  Yellow: '#FFD700',
  Red: '#DC143C',
  Green: '#228B22',
  Blue: '#1E40AF',
  Indigo: '#4F46E5',
  Saffron: '#F59E0B',
  Coral: '#FF7F50',
  Maroon: '#800000',
  'Smoky Grey': '#6B7280',
  Gold: '#D4AF37',
  Orange: '#FF8C00',
  Rose: '#FB7185',
};

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatLongDate(s) {
  return parseISO(s).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function formatWeekRange(start, end) {
  const a = parseISO(start);
  const b = parseISO(end);
  const fmt = { day: 'numeric', month: 'short' };
  return `${a.toLocaleDateString('en-GB', fmt)} – ${b.toLocaleDateString('en-GB', fmt)}`;
}

function formatMonthLabel(s) {
  const [y, m] = s.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayMonStart(year, month) {
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}

function toneToBadge(tone) {
  if (tone === 'Favourable') return { bg: 'var(--emerald-50)', fg: 'var(--emerald-700)', dot: 'var(--emerald)' };
  if (tone === 'Mixed') return { bg: 'var(--amber-50)', fg: 'var(--amber-700)', dot: 'var(--amber)' };
  return { bg: 'var(--rose-50)', fg: 'var(--rose-700)', dot: 'var(--rose)' };
}

export default function JatakaReportsSection({ c }) {
  const reports = JATAKA_REPORTS[c.id] || { daily: [], weekly: [], monthly: [] };
  const [view, setView] = useState('daily');

  const sortedDaily = useMemo(
    () => [...reports.daily].sort((a, b) => a.date.localeCompare(b.date)),
    [reports.daily]
  );
  const sortedWeekly = useMemo(
    () => [...reports.weekly].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    [reports.weekly]
  );
  const sortedMonthly = useMemo(
    () => [...reports.monthly].sort((a, b) => a.month.localeCompare(b.month)),
    [reports.monthly]
  );

  const dailySet = useMemo(() => new Set(sortedDaily.map((d) => d.date)), [sortedDaily]);
  const dailyByDate = useMemo(
    () => Object.fromEntries(sortedDaily.map((d) => [d.date, d])),
    [sortedDaily]
  );

  const initialMonth = sortedDaily.length
    ? parseISO(sortedDaily[sortedDaily.length - 1].date)
    : new Date();
  const [viewedYear, setViewedYear] = useState(initialMonth.getFullYear());
  const [viewedMonth, setViewedMonth] = useState(initialMonth.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const [selectedWeek, setSelectedWeek] = useState(
    sortedWeekly.length ? sortedWeekly.length - 1 : 0
  );
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(
    sortedMonthly.length ? sortedMonthly.length - 1 : 0
  );

  useEffect(() => {
    if (view === 'weekly' && sortedWeekly.length) setSelectedWeek(sortedWeekly.length - 1);
    if (view === 'monthly' && sortedMonthly.length) setSelectedMonthIdx(sortedMonthly.length - 1);
  }, [view, sortedWeekly.length, sortedMonthly.length]);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Jataka Reports</div>
        <div
          style={{
            display: 'inline-flex',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <SegTab active={view === 'daily'} onClick={() => setView('daily')}>
            Daily
          </SegTab>
          <SegTab active={view === 'weekly'} onClick={() => setView('weekly')}>
            Weekly
          </SegTab>
          <SegTab active={view === 'monthly'} onClick={() => setView('monthly')}>
            Monthly
          </SegTab>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {view === 'daily' && (
          <DailyView
            year={viewedYear}
            month={viewedMonth}
            onPrevMonth={() => {
              const d = new Date(viewedYear, viewedMonth - 1, 1);
              setViewedYear(d.getFullYear());
              setViewedMonth(d.getMonth());
            }}
            onNextMonth={() => {
              const d = new Date(viewedYear, viewedMonth + 1, 1);
              setViewedYear(d.getFullYear());
              setViewedMonth(d.getMonth());
            }}
            dailySet={dailySet}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            entry={selectedDate ? dailyByDate[selectedDate] : null}
            isMissing={selectedDate && !dailyByDate[selectedDate]}
          />
        )}

        {view === 'weekly' && (
          <WeeklyView
            entries={sortedWeekly}
            selectedIdx={selectedWeek}
            onSelect={setSelectedWeek}
          />
        )}

        {view === 'monthly' && (
          <MonthlyView
            entries={sortedMonthly}
            selectedIdx={selectedMonthIdx}
            onSelect={setSelectedMonthIdx}
          />
        )}
      </div>
    </Card>
  );
}

function SegTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        background: active ? 'var(--indigo)' : '#fff',
        color: active ? '#fff' : 'var(--text)',
        border: 'none',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background .15s',
      }}
    >
      {children}
    </button>
  );
}

function DailyView({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  dailySet,
  selectedDate,
  onSelect,
  entry,
  isMissing,
}) {
  const totalDays = daysInMonth(year, month);
  const offset = firstWeekdayMonStart(year, month);
  const today = new Date();
  const todayISO =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <button
          onClick={onPrevMonth}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          <IArrowLeft size={14} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {formatMonthYear(year, month)}
        </div>
        <button
          onClick={onNextMonth}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          <IArrowRight size={14} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 36px)',
          gap: 6,
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--muted)',
              textAlign: 'center',
              letterSpacing: 0.4,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 36px)',
          gap: 6,
          justifyContent: 'center',
        }}
      >
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const has = dailySet.has(iso);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayISO;
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: isToday ? '2px solid var(--indigo-100)' : '1px solid transparent',
                background: isSelected ? 'var(--indigo)' : '#fff',
                color: isSelected ? '#fff' : 'var(--text)',
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background .15s, color .15s',
              }}
            >
              {d}
              {has && !isSelected && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--indigo)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        {entry ? (
          <DailyReportCard entry={entry} />
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 13,
              border: '1.5px dashed var(--border)',
              borderRadius: 10,
            }}
          >
            {isMissing ? 'No report available for this date.' : 'Select a date to view the daily report.'}
          </div>
        )}
      </div>
    </div>
  );
}

function DailyReportCard({ entry }) {
  const colourHex = COLOUR_MAP[entry.luckyColour] || '#9CA3AF';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        border: '1px solid var(--border-soft)',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-soft)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {formatLongDate(entry.date)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 230px) 1fr' }}>
        <div
          style={{
            background: 'var(--indigo-50)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderRight: '1px solid var(--border-soft)',
          }}
        >
          <Block label="Panchang">
            <KV k="Tithi" v={entry.panchang.tithi} />
            <KV k="Nakshatra" v={entry.panchang.nakshatra} />
            <KV k="Yoga" v={entry.panchang.yoga} />
            <KV k="Vara" v={entry.panchang.vara} />
          </Block>

          <div
            style={{
              padding: '8px 10px',
              background: 'var(--amber-50)',
              border: '1px solid var(--amber-100)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--amber-700)',
                marginBottom: 2,
              }}
            >
              Rahu Kaal
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              {entry.rahuKaal}
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              background: 'var(--emerald-50)',
              border: '1px solid var(--emerald-100)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--emerald-700)',
                marginBottom: 2,
              }}
            >
              Abhijit Muhurta
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              {entry.abhijitMuhurta}
            </div>
          </div>

          <Block label="Moon">
            <div style={{ fontSize: 12, color: '#374151' }}>
              In <b style={{ color: 'var(--indigo-700)' }}>{entry.moonSign}</b>
            </div>
          </Block>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Block label="Today's Guidance">
            <Line k="Dasha" v={entry.dashaInsight} />
            <Line k="Transit" v={entry.transitAlert} />
          </Block>

          <div style={{ borderTop: '1px solid var(--border-soft)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Line k="Career" v={entry.careerTip} />
            <Line k="Finance" v={entry.financeTip} />
            <Line k="Health" v={entry.healthTip} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-soft)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12 }}>
            <KV
              k="Colour"
              v={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: colourHex,
                      border: '1px solid var(--border)',
                      display: 'inline-block',
                    }}
                  />
                  {entry.luckyColour}
                </span>
              }
            />
            <KV k="Number" v={entry.luckyNumber} />
            <KV k="Direction" v={entry.luckyDirection} />
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderTop: '1px solid var(--border-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: '#FCFCFD',
        }}
      >
        <TagRow label="Good for" items={entry.auspiciousFor} tone="emerald" />
        <TagRow label="Avoid" items={entry.avoidToday} tone="rose" />
      </div>
    </motion.div>
  );
}

function WeeklyView({ entries, selectedIdx, onSelect }) {
  if (!entries.length)
    return <Empty>No weekly reports available.</Empty>;

  const entry = entries[selectedIdx] || entries[entries.length - 1];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {entries.map((w, i) => (
          <Pill key={w.weekStart} active={i === selectedIdx} onClick={() => onSelect(i)}>
            {formatWeekRange(w.weekStart, w.weekEnd)}
          </Pill>
        ))}
      </div>
      <WeeklyReportCard entry={entry} />
    </div>
  );
}

function WeeklyReportCard({ entry }) {
  const tone = toneToBadge(entry.overallTone);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: tone.bg,
          color: tone.fg,
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          width: 'fit-content',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: tone.dot }} />
        Overall tone: {entry.overallTone}
      </div>

      <Tinted bg="var(--indigo-50)" label="Key Transit">
        {entry.keyTransit}
      </Tinted>

      <Tinted bg="var(--purple-50)" label="Dasha Insight">
        {entry.dashaInsight}
      </Tinted>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <AreaCard title="Career" body={entry.career} />
        <AreaCard title="Finance" body={entry.finance} />
        <AreaCard title="Health" body={entry.health} />
        <AreaCard title="Relations" body={entry.relations} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <TagRow label="Best days" items={entry.bestDays} tone="emerald" />
        <TagRow label="Avoid" items={entry.avoidDays} tone="rose" />
      </div>

      <Tinted bg="var(--emerald-50)" label="Muhurta">
        {entry.muhurta}
      </Tinted>
    </motion.div>
  );
}

function MonthlyView({ entries, selectedIdx, onSelect }) {
  if (!entries.length) return <Empty>No monthly reports available.</Empty>;
  const entry = entries[selectedIdx] || entries[entries.length - 1];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {entries.map((m, i) => (
          <Pill key={m.month} active={i === selectedIdx} onClick={() => onSelect(i)}>
            {formatMonthLabel(m.month)}
          </Pill>
        ))}
      </div>
      <MonthlyReportCard entry={entry} />
    </div>
  );
}

function MonthlyReportCard({ entry }) {
  const tone = toneToBadge(entry.overallTone);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: tone.bg,
          color: tone.fg,
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          width: 'fit-content',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: tone.dot }} />
        Overall tone: {entry.overallTone}
      </div>

      <Tinted bg="var(--indigo-50)" label="Major Transit">
        {entry.majorTransit}
      </Tinted>

      <Tinted bg="var(--purple-50)" label="Dasha Insight">
        {entry.dashaInsight}
      </Tinted>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AccentRow accent="var(--indigo)" title="Career" body={entry.career} />
        <AccentRow accent="var(--emerald)" title="Finance" body={entry.finance} />
        <AccentRow accent="var(--amber)" title="Health" body={entry.health} />
        <AccentRow accent="var(--rose)" title="Relations" body={entry.relations} />
      </div>

      <div>
        <SmallLabel>Key Dates</SmallLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {entry.keyDates.map((d) => (
            <div key={d.date} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: 'var(--indigo)',
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                <b style={{ color: 'var(--text)' }}>{formatLongDate(d.date)}</b> — {d.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Tinted bg="var(--emerald-50)" label="Muhurta">
        {entry.muhurta}
      </Tinted>

      <div
        style={{
          padding: 14,
          background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)',
          border: '1px solid var(--amber-100)',
          borderRadius: 10,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: '#374151',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 18, color: 'var(--amber-700)', lineHeight: 1, marginTop: 1 }}>ॐ</span>
        <div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: 'var(--amber-700)',
              marginBottom: 2,
            }}
          >
            Remedy
          </div>
          {entry.remedy}
        </div>
      </div>
    </motion.div>
  );
}

function Block({ label, children }) {
  return (
    <div>
      <SmallLabel>{label}</SmallLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {children}
      </div>
    </div>
  );
}

function SmallLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}
    >
      {children}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

function Line({ k, v }) {
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#374151' }}>
      <b style={{ color: 'var(--indigo-700)' }}>{k}:</b> {v}
    </div>
  );
}

function AreaCard({ title, body }) {
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid var(--border-soft)',
        borderRadius: 10,
        background: '#FCFCFD',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

function AccentRow({ accent, title, body }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid var(--border-soft)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

function Tinted({ bg, label, children }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: bg,
        borderRadius: 10,
        fontSize: 12.5,
        lineHeight: 1.55,
        color: '#374151',
      }}
    >
      <SmallLabel>{label}</SmallLabel>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 999,
        border: '1px solid ' + (active ? 'var(--indigo)' : 'var(--border)'),
        background: active ? 'var(--indigo)' : '#fff',
        color: active ? '#fff' : 'var(--text)',
        fontSize: 11.5,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background .15s, color .15s, border-color .15s',
      }}
    >
      {children}
    </button>
  );
}

function TagRow({ label, items, tone }) {
  const t =
    tone === 'emerald'
      ? { bg: 'var(--emerald-50)', fg: 'var(--emerald-700)' }
      : { bg: 'var(--rose-50)', fg: 'var(--rose-700)' };
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {label}
      </span>
      {items.map((s, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
            padding: '2px 9px',
            borderRadius: 999,
            background: t.bg,
            color: t.fg,
            fontWeight: 600,
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function Empty({ children }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: 13,
        border: '1.5px dashed var(--border)',
        borderRadius: 10,
      }}
    >
      {children}
    </div>
  );
}
