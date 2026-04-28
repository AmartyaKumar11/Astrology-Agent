import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_DATA } from '../data.js';
import { IBattery, IGrid, IShield, IWifi, StartLogo } from './icons.jsx';

export default function Taskbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const hilPending = MOCK_DATA.filter((c) => c.status === 'HIL_PENDING').length;

  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isHome = pathname === '/';
  const isQueue =
    pathname.startsWith('/queue') ||
    pathname.startsWith('/consultation') ||
    pathname.startsWith('/report');
  const isHil = pathname.startsWith('/hil');

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 40,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.5)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ width: 120 }} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <TaskbarBtn onClick={() => nav('/')} active={isHome} title="Desktop">
          <StartLogo size={20} />
        </TaskbarBtn>
        <TaskbarBtn onClick={() => nav('/queue')} active={isQueue} title="Consultation Queue">
          <IGrid size={18} />
        </TaskbarBtn>
        <TaskbarBtn onClick={() => nav('/hil')} active={isHil} badge={hilPending} title="HIL Review Board">
          <IShield size={18} />
        </TaskbarBtn>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingRight: 8, color: 'var(--text)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            background: 'var(--emerald-50)',
            color: 'var(--emerald-700)',
            padding: '5px 10px',
            borderRadius: 999,
            fontWeight: 600,
            border: '1px solid var(--emerald-100)',
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: 'var(--emerald)',
              color: 'var(--emerald)',
              display: 'inline-block',
            }}
          />
          Agent Status: ACTIVE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
          <IWifi size={14} />
          <IBattery size={14} />
        </div>
        <div
          style={{
            textAlign: 'right',
            lineHeight: 1.1,
            paddingLeft: 6,
            borderLeft: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{timeStr}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{dateStr}</div>
        </div>
      </div>
    </div>
  );
}

function TaskbarBtn({ children, active, onClick, badge, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: active ? 'rgba(79,70,229,0.10)' : 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#374151',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = active ? 'rgba(79,70,229,0.10)' : 'transparent')
      }
    >
      {children}
      {badge ? (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 999,
            background: 'var(--rose)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #fff',
          }}
        >
          {badge}
        </span>
      ) : null}
      {active && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            width: 14,
            height: 2,
            borderRadius: 2,
            background: 'var(--indigo)',
          }}
        />
      )}
    </button>
  );
}
