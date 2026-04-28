import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATUS_META } from '../data.js';
import { IHome } from './icons.jsx';

export function Card({ children, style, hover, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <div
      {...rest}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: h && hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow .15s ease, border-color .15s ease, transform .15s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({ tone = 'neutral', children, dot = false, style = {} }) {
  const map = {
    indigo:  { bg: 'var(--indigo-50)',  fg: 'var(--indigo-700)',  dot: 'var(--indigo)'  },
    amber:   { bg: 'var(--amber-50)',   fg: 'var(--amber-700)',   dot: 'var(--amber)'   },
    emerald: { bg: 'var(--emerald-50)', fg: 'var(--emerald-700)', dot: 'var(--emerald)' },
    rose:    { bg: 'var(--rose-50)',    fg: 'var(--rose-700)',    dot: 'var(--rose)'    },
    blue:    { bg: 'var(--blue-50)',    fg: '#1D4ED8',            dot: 'var(--blue)'    },
    purple:  { bg: 'var(--purple-50)',  fg: '#6D28D9',            dot: 'var(--purple)'  },
    neutral: { bg: '#F3F4F6',           fg: '#374151',            dot: '#6B7280'        },
  };
  const t = map[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: t.bg,
        color: t.fg,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.1,
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot }} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function ConfidenceBar({ value, height = 6, showLabel = true }) {
  const c = value >= 75 ? 'var(--emerald)' : value >= 50 ? 'var(--amber)' : 'var(--rose)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: c, transition: 'width .4s ease' }} />
      </div>
      {showLabel && (
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 32, textAlign: 'right' }}>
          {value}%
        </div>
      )}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', children, style = {}, ...rest }) {
  const v = {
    primary:   { background: 'var(--indigo)',  color: '#fff',         border: '1px solid var(--indigo)' },
    secondary: { background: '#fff',           color: 'var(--text)',  border: '1px solid var(--border)' },
    success:   { background: 'var(--emerald)', color: '#fff',         border: '1px solid var(--emerald)' },
    danger:    { background: 'var(--rose)',    color: '#fff',         border: '1px solid var(--rose)' },
    warning:   { background: 'var(--amber)',   color: '#fff',         border: '1px solid var(--amber)' },
    ghost:     { background: 'transparent',    color: 'var(--text)',  border: '1px solid transparent' },
  }[variant];
  const s = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 14px', fontSize: 13 },
    lg: { padding: '10px 18px', fontSize: 14 },
  }[size];
  return (
    <button
      {...rest}
      style={{
        ...v,
        ...s,
        fontWeight: 600,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'filter .15s ease, transform .15s ease',
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, right }) {
  const nav = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 28px',
        background: '#fff',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button
        onClick={() => nav('/')}
        title="Desktop"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'var(--indigo-50)',
          color: 'var(--indigo)',
          border: '1px solid var(--indigo-100)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <IHome size={18} />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function AgentChip() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--indigo-50)',
        color: 'var(--indigo-700)',
        padding: '6px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: '1px solid var(--indigo-100)',
      }}
    >
      <span
        className="pulse-dot"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 999,
          background: 'var(--emerald)',
          color: 'var(--emerald)',
        }}
      />
      Agent ACTIVE
    </div>
  );
}
