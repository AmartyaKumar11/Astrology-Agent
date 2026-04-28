// North-Indian style Kundli chart drawn with SVG + absolutely-positioned planet labels.
import { formatPlanetHindiEnglish } from '../utils/astrologyTerms.js';

const HOUSE_POSITIONS = {
  1:  { x: 50,   y: 25 },
  2:  { x: 25,   y: 12.5 },
  3:  { x: 12.5, y: 25 },
  4:  { x: 25,   y: 50 },
  5:  { x: 12.5, y: 75 },
  6:  { x: 25,   y: 87.5 },
  7:  { x: 50,   y: 75 },
  8:  { x: 75,   y: 87.5 },
  9:  { x: 87.5, y: 75 },
  10: { x: 75,   y: 50 },
  11: { x: 87.5, y: 25 },
  12: { x: 75,   y: 12.5 },
};

const PLANET_COLOR = {
  Su: '#F59E0B',
  Mo: '#6B7280',
  Ma: '#EF4444',
  Me: '#10B981',
  Ju: '#F97316',
  Ve: '#EC4899',
  Sa: '#1F2937',
  Ra: '#7C3AED',
  Ke: '#7C3AED',
  Lg: '#4F46E5',
};

const PLANET_ABBR_TO_NAME = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
  Ra: 'Rahu',
  Ke: 'Ketu',
  Lg: 'Lagna',
};

const PLANET_ABBR_TO_COMPACT_HINDI = {
  Su: 'सूर्य',
  Mo: 'चंद्र',
  Ma: 'मंगल',
  Me: 'बुध',
  Ju: 'बृह',
  Ve: 'शुक्र',
  Sa: 'शनि',
  Ra: 'राहु',
  Ke: 'केतु',
  Lg: 'लग्न',
};

export default function KundliChart({ chart, size = 320, lagnaSign }) {
  const S = size;
  return (
    <div
      style={{
        width: S,
        height: S,
        position: 'relative',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <svg width={S} height={S} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <rect x="0.5" y="0.5" width={S - 1} height={S - 1} fill="none" stroke="#E5E7EB" />
        <line x1="0" y1="0" x2={S} y2={S} stroke="#E5E7EB" />
        <line x1={S} y1="0" x2="0" y2={S} stroke="#E5E7EB" />
        <polygon
          points={`${S / 2},0 ${S},${S / 2} ${S / 2},${S} 0,${S / 2}`}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.2"
        />
      </svg>

      {Object.entries(HOUSE_POSITIONS).map(([h, pos]) => {
        const planets = chart[h] || [];
        return (
          <div
            key={h}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%,-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minWidth: 40,
            }}
          >
            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{h}</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
                maxWidth: 64,
              }}
            >
              {planets.map((p, i) => (
                <span
                  key={i}
                  title={PLANET_ABBR_TO_NAME[p] ? formatPlanetHindiEnglish(PLANET_ABBR_TO_NAME[p]) : p}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    color: PLANET_COLOR[p] || '#111827',
                    lineHeight: 1.1,
                    padding: '1px 4px',
                    background: '#F9FAFB',
                    border: '1px solid ' + (p === 'Lg' ? 'var(--indigo-100)' : '#E5E7EB'),
                    borderRadius: 4,
                  }}
                >
                  {PLANET_ABBR_TO_COMPACT_HINDI[p] || p}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {lagnaSign && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 11,
            color: 'var(--muted)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: '#9CA3AF',
            }}
          >
            Lagna
          </div>
          <div style={{ fontSize: 13, color: 'var(--indigo)', fontWeight: 700 }}>{lagnaSign}</div>
        </div>
      )}
    </div>
  );
}
