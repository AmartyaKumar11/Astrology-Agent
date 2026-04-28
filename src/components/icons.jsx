// Lightweight stroke icons. 1.6px stroke, rounded.
const wrap = (size, children) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const IGrid = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  );

export const IShield = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  );

export const ITerminal = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <polyline points="4 7 9 12 4 17" />
      <line x1="12" y1="17" x2="20" y2="17" />
    </>
  );

export const IDoc = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </>
  );

export const IHome = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  );

export const IArrowLeft = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  );

export const IArrowRight = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  );

export const ICheck = ({ size = 14 }) => wrap(size, <polyline points="4 12 10 18 20 6" />);

export const IX = ({ size = 14 }) =>
  wrap(
    size,
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  );

export const IFlag = ({ size = 14 }) =>
  wrap(
    size,
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2 4 2 4H5" />
    </>
  );

export const IPrint = ({ size = 16 }) =>
  wrap(
    size,
    <>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </>
  );

export const ISearch = ({ size = 16 }) =>
  wrap(
    size,
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </>
  );

export const IBell = ({ size = 16 }) =>
  wrap(
    size,
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  );

export const IWifi = ({ size = 14 }) =>
  wrap(
    size,
    <>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M2 8.82a16 16 0 0 1 20 0" />
      <path d="M8.5 16.4a6 6 0 0 1 7 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </>
  );

export const IBattery = ({ size = 14 }) =>
  wrap(
    size,
    <>
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
    </>
  );

export const ISparkle = ({ size = 16 }) =>
  wrap(
    size,
    <>
      <path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8z" />
    </>
  );

export const IStar = ({ size = 14 }) =>
  wrap(size, <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />);

export const IClock = ({ size = 14 }) =>
  wrap(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </>
  );

export const ICircleUser = ({ size = 18 }) =>
  wrap(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M5.5 19a7 7 0 0 1 13 0" />
    </>
  );

export const StartLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 5l7-1v8H3z" fill="#4F46E5" />
    <path d="M11 4l10-1.4V12H11z" fill="#6366F1" />
    <path d="M3 13h7v8l-7-1z" fill="#818CF8" />
    <path d="M11 13h10v8.4L11 21z" fill="#A78BFA" />
  </svg>
);
