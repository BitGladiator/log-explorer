import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { logout, getProjects, createProject, getDashboardStats } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';


const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #f4f6f9;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
  }

  .nav {
    background: #ffffff;
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 28px;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .nav-logo-box {
    width: 30px; height: 30px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .nav-brand-text {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
  }
  .nav-divider {
    width: 1px;
    height: 20px;
    background: #e2e8f0;
    margin: 0 4px;
  }
  .nav-links {
    display: flex;
    gap: 2px;
    flex: 1;
  }
  .nav-link {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    transition: color 0.15s, background 0.15s;
  }
  .nav-link:hover { color: #0f172a; background: #f1f5f9; }
  .nav-link.active { color: #0d9488; background: #f0fdfa; }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
  .nav-user {
    font-size: 12px;
    color: #94a3b8;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #0f766e);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .nav-logout {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    background: none;
    font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .nav-logout:hover { color: #be123c; border-color: #fecdd3; background: #fff1f2; }


  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 28px 24px 48px;
  }


  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
  }
  .page-title { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
  .page-sub   { font-size: 13px; color: #64748b; margin-top: 3px; }


  .alert-strip {
    display: flex;
    gap: 10px;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }
  .alert-pill {
    flex: 1; min-width: 220px;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    display: flex; align-items: center; gap: 8px;
  }
  .alert-pill.err  { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }
  .alert-pill.warn { background: #fffbeb; border: 1px solid #fde68a; color: #b45309; }


  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 22px;
  }
  @media (max-width: 800px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  .stat-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: box-shadow 0.18s, border-color 0.18s;
  }
  .stat-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.07); border-color: #99f6e4; }
  .stat-card.danger { border-color: #fecdd3; }
  .stat-card.danger:hover { border-color: #fda4af; box-shadow: 0 4px 18px rgba(190,18,60,0.07); }
  .stat-row { display: flex; justify-content: space-between; align-items: center; }
  .stat-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .stat-label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: #94a3b8;
  }
  .stat-value {
    font-size: 28px; font-weight: 700;
    color: #0f172a; letter-spacing: -0.8px; line-height: 1;
    margin-top: 2px;
  }
  .stat-value.danger { color: #be123c; }
  .stat-footer { display: flex; align-items: center; justify-content: space-between; }
  .stat-sub { font-size: 11px; color: #94a3b8; }


  .charts-row {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 14px;
    margin-bottom: 22px;
  }
  @media (max-width: 700px) { .charts-row { grid-template-columns: 1fr; } }


  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 20px 22px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .card-title { font-size: 13px; font-weight: 600; color: #0f172a; }
  .card-sub   { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .legend {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; }
  .legend-dot  { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }


  .chart-empty {
    display: flex; align-items: center; justify-content: center;
    height: 100px;
    color: #94a3b8; font-size: 13px;
    border: 1px dashed #e2e8f0;
    border-radius: 10px;
  }


  .proj-bar { padding: 9px 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
  .proj-bar:last-child { border-bottom: none; }
  .proj-bar:hover .proj-bar-name { color: #0d9488; }
  .proj-bar-meta { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .proj-bar-name { font-size: 12px; font-weight: 500; color: #334155; transition: color 0.12s; }
  .proj-bar-count { font-size: 11px; color: #94a3b8; }
  .proj-bar-track { height: 5px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
  .proj-bar-fill  { height: 100%; border-radius: 99px; position: relative; }
  .proj-bar-err   { position: absolute; right: 0; top: 0; height: 100%; border-radius: 0 99px 99px 0; }


  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }
  .section-title { font-size: 15px; font-weight: 700; color: #0f172a; }
  .section-sub   { font-size: 12px; color: #64748b; margin-top: 2px; }


  .table-wrap {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
  }
  .tbl { width: 100%; border-collapse: collapse; }
  .tbl th {
    font-size: 11px; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.06em;
    padding: 11px 20px; text-align: left;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .tbl td {
    font-size: 13px; color: #334155;
    padding: 13px 20px; border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tbody tr { cursor: pointer; transition: background 0.1s; }
  .tbl tbody tr:hover { background: #f0fdfa; }
  .tbl tbody tr:hover .tbl-name { color: #0d9488; }
  .tbl-name { font-weight: 600; color: #0f172a; transition: color 0.1s; }
  .tbl-muted { color: #64748b; }
  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    padding: 3px 9px; border-radius: 20px;
  }
  .badge-ok   { background: #f0fdf4; color: #15803d; }
  .badge-warn { background: #fffbeb; color: #b45309; }
  .badge-dot  { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }


  .create-bar {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 12px;
    display: flex; gap: 10px; align-items: center;
  }
  .db-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e2e8f0; border-radius: 8px;
    font-size: 13px; outline: none;
    font-family: inherit; color: #1e293b; background: #fff;
    transition: border-color 0.15s;
  }
  .db-input:focus { border-color: #14b8a6; }
  .btn-primary {
    padding: 8px 18px;
    background: #0f766e; color: #fff;
    border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: inherit;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .btn-primary:hover { background: #0d9488; }
  .btn-ghost {
    padding: 8px 14px;
    background: none; border: 1px solid #e2e8f0; border-radius: 8px;
    font-size: 13px; color: #64748b;
    cursor: pointer; font-family: inherit;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .btn-ghost:hover { border-color: #94a3b8; color: #334155; }


  .db-empty {
    text-align: center; padding: 60px 20px;
  }
  .db-empty p { font-size: 14px; color: #94a3b8; margin-bottom: 16px; }
  .db-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
    gap: 16px;
    color: #94a3b8;
    font-size: 13px;
  }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 6px); left: 50%;
    transform: translateX(-50%);
    background: #0f172a; color: #f1f5f9;
    font-size: 11px; padding: 5px 9px;
    border-radius: 6px; white-space: nowrap;
    pointer-events: none; z-index: 300;
    box-shadow: 0 4px 12px rgba(0,0,0,0.28);
  }
  .tooltip::after {
    content: '';
    position: absolute; top: 100%; left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent; border-top-color: #0f172a;
  }
`;


const Sparkline = ({ data, color = '#14b8a6', height = 36, width = 80 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height * 0.82 - height * 0.06;
    return `${x},${y}`;
  });
  const area = [`0,${height}`, ...pts, `${width},${height}`].join(' ');
  const gId = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gId})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};



const ActivityChart = ({ hourly }) => {
  const [hovered, setHovered] = useState(null);

  const now = new Date();
  const filled = Array.from({ length: 24 }, (_, i) => {
    const h = new Date(now);
    h.setHours(now.getHours() - 23 + i, 0, 0, 0);
    const key = h.toISOString().slice(0, 13);
    const found = (hourly || []).find((x) => new Date(x.hour).toISOString().slice(0, 13) === key);
    return {
      label: `${h.getHours()}:00`,
      total:  parseInt(found?.total  || 0),
      errors: parseInt(found?.errors || 0) + parseInt(found?.fatals || 0),
      warns:  parseInt(found?.warns  || 0),
    };
  });

  const hasData = filled.some((f) => f.total > 0);
  const max = Math.max(...filled.map((f) => f.total), 1);

  if (!hasData) {
    return <div className="chart-empty">No log activity in the last 24 hours</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '96px' }}>
        {filled.map((h, i) => {
          const totalPct = (h.total / max) * 100;
          const errPct   = h.total > 0 ? (h.errors / h.total) * totalPct : 0;
          const warnPct  = h.total > 0 ? (h.warns  / h.total) * totalPct : 0;
          const infoPct  = totalPct - errPct - warnPct;
          const isHov    = hovered === i;

          return (
            <div
              key={i}
              style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', cursor: 'default' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && h.total > 0 && (
                <div className="tooltip">
                  {h.label} · {h.total.toLocaleString()} logs{h.errors > 0 ? ` · ${h.errors} err` : ''}
                </div>
              )}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {errPct  > 0 && <div style={{ height: `${errPct}%`,  minHeight: 2, borderRadius: '2px 2px 0 0', background: isHov ? '#f43f5e' : '#fecdd3' }} />}
                {warnPct > 0 && <div style={{ height: `${warnPct}%`, minHeight: 2, background: isHov ? '#f59e0b' : '#fde68a' }} />}
                {infoPct > 0 && (
                  <div style={{
                    height: `${infoPct}%`, minHeight: 2,
                    borderRadius: errPct === 0 && warnPct === 0 ? '2px 2px 0 0' : 0,
                    background: isHov ? '#14b8a6' : '#99f6e4',
                  }} />
                )}
                {h.total === 0 && <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2 }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {[0, 6, 12, 18, 23].map((i) => (
          <span key={i} style={{ fontSize: 10, color: '#94a3b8' }}>{filled[i]?.label}</span>
        ))}
      </div>
    </div>
  );
};


const DonutChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const COLORS = { debug: '#e2e8f0', info: '#14b8a6', warn: '#f59e0b', error: '#f43f5e', fatal: '#7f1d1d' };

  if (!data || data.length === 0) {
    return <div className="chart-empty" style={{ height: 120 }}>No log data yet</div>;
  }

  const total  = data.reduce((s, d) => s + parseInt(d.count), 0);
  const SIZE = 110, R = 40, IR = 24, CX = SIZE / 2, CY = SIZE / 2;
  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const count = parseInt(d.count);
    const sweep = (count / total) * 2 * Math.PI;
    const start = angle;
    angle += sweep;
    return { ...d, count, start, end: angle };
  });

  const pt = (a, r) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });
  const arc = (s, e, oR, iR) => {
    const os = pt(s, oR), oe = pt(e, oR), is_ = pt(s, iR), ie = pt(e, iR);
    const lg = e - s > Math.PI ? 1 : 0;
    return `M${os.x} ${os.y} A${oR} ${oR} 0 ${lg} 1 ${oe.x} ${oe.y} L${ie.x} ${ie.y} A${iR} ${iR} 0 ${lg} 0 ${is_.x} ${is_.y} Z`;
  };

  const hov = hovered !== null ? slices[hovered] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path
            key={s.level}
            d={arc(s.start, s.end, hovered === i ? R + 4 : R, IR)}
            fill={COLORS[s.level] || '#e2e8f0'}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
          {hov ? hov.count.toLocaleString() : total.toLocaleString()}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize="9" fill="#94a3b8">
          {hov ? hov.level : 'total'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map((s, i) => (
          <div
            key={s.level}
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', opacity: hovered !== null && hovered !== i ? 0.3 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 9, height: 9, borderRadius: 3, background: COLORS[s.level], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569', textTransform: 'capitalize', flex: 1 }}>{s.level}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{((s.count / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const StatCard = ({ label, value, sub, color, bgColor, icon, sparkData, danger }) => (
  <div className={`stat-card${danger ? ' danger' : ''}`}>
    <div className="stat-row">
      <div className="stat-icon" style={{ background: bgColor }}>{icon}</div>
      <Sparkline data={sparkData} color={color} />
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value${danger ? ' danger' : ''}`}>{value}</div>
    </div>
    <div className="stat-footer">
      <span className="stat-sub">{sub}</span>
    </div>
  </div>
);


const IcoActivity = ({ color = '#14b8a6' }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcoAlertCircle = ({ color = '#be123c' }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoDatabase = ({ color = '#0891b2' }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
const IcoFolder = ({ color = '#d97706' }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const IcoLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IcoWave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);


const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [projects,  setProjects]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState('');
  const [loading,   setLoading]   = useState(true);
  const [statsErr,  setStatsErr]  = useState(false);
  const [createErr, setCreateErr] = useState('');


  useEffect(() => {
    Promise.all([getProjects(), getDashboardStats()])
      .then(([p, s]) => { setProjects(p); setStats(s); })
      .catch((err) => { console.error(err); setStatsErr(true); })
      .finally(() => setLoading(false));
  }, []);


  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    setUser(null);
    navigate('/login');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateErr('');
    try {
      const project = await createProject({ name: newName.trim() });
      setProjects((prev) => [project, ...prev]);
      setNewName('');
      setCreating(false);
    } catch (err) {
      setCreateErr(err?.error || 'Failed to create project. Please try again.');
    }
  };


  const sparkTotal  = stats?.hourly?.map((h) => parseInt(h.total))                           || [];
  const sparkErrors = stats?.hourly?.map((h) => parseInt(h.errors) + parseInt(h.fatals))     || [];
  const fmt         = (n) => parseInt(n || 0).toLocaleString();
  const avatarChar  = (user?.email || user?.name || 'U')[0].toUpperCase();

  const topProjects = stats?.topProjects?.filter((p) => parseInt(p.total_today) > 0) || [];
  const topMax      = topProjects.length ? Math.max(...topProjects.map((p) => parseInt(p.total_today)), 1) : 1;

  return (
    <>
      <style>{CSS}</style>


      <nav className="nav">
        <div className="nav-brand">
          {/* <div className="nav-logo-box"><IcoWave /></div> */}
          <span className="nav-brand-text">Log Explorer</span>
        </div>
        <div className="nav-divider" />
        <div className="nav-links">
          <button className="nav-link active">Dashboard</button>
        </div>
        <div className="nav-right">
          <span className="nav-user">{user?.email || user?.name || ''}</span>
          <div className="nav-avatar">{avatarChar}</div>
          <button className="nav-logout" onClick={handleLogout}>
            <IcoLogout /> Logout
          </button>
        </div>
      </nav>


      <div className="page">


        <div className="page-header">
          <div>
            <div className="page-title">Overview</div>
            <div className="page-sub">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button className="btn-primary" onClick={() => { setCreating(true); setCreateErr(''); }}>
            + New Project
          </button>
        </div>

        {!loading && (stats?.openAlerts > 0 || stats?.openAnomalies > 0) && (
          <div className="alert-strip">
            {stats.openAlerts > 0 && (
              <div className="alert-pill err">
                <IcoInfo />
                {stats.openAlerts} unacknowledged alert{stats.openAlerts !== 1 ? 's' : ''} in the last 24h
              </div>
            )}
            {stats.openAnomalies > 0 && (
              <div className="alert-pill warn">
                <IcoWarn />
                {stats.openAnomalies} anomal{stats.openAnomalies !== 1 ? 'ies' : 'y'} detected in the last 24h
              </div>
            )}
          </div>
        )}


        {statsErr && (
          <div className="alert-strip">
            <div className="alert-pill warn">
              <IcoWarn /> Could not load dashboard stats. Check your server connection.
            </div>
          </div>
        )}


        <div className="stats-grid">
          <StatCard
            label="Logs Today"
            value={loading ? '—' : fmt(stats?.totals?.logs_24h)}
            sub="Last 24 hours"
            color="#14b8a6"
            bgColor="#f0fdfa"
            sparkData={sparkTotal}
            icon={<IcoActivity color="#14b8a6" />}
          />
          <StatCard
            label="Errors Today"
            value={loading ? '—' : fmt(stats?.totals?.errors_24h)}
            sub="Error + Fatal"
            color="#f43f5e"
            bgColor="#fff1f2"
            sparkData={sparkErrors}
            danger={!loading && parseInt(stats?.totals?.errors_24h) > 0}
            icon={<IcoAlertCircle color="#be123c" />}
          />
          <StatCard
            label="Total Logs"
            value={loading ? '—' : fmt(stats?.totals?.total_logs)}
            sub="All time"
            color="#0891b2"
            bgColor="#ecfeff"
            icon={<IcoDatabase color="#0891b2" />}
          />
          <StatCard
            label="Projects"
            value={loading ? '—' : fmt(stats?.totals?.total_projects ?? projects.length)}
            sub={
              !loading
                ? projects.filter((p) => p.storage_warning).length > 0
                  ? `${projects.filter((p) => p.storage_warning).length} with storage warning`
                  : 'All healthy'
                : 'Loading…'
            }
            color="#d97706"
            bgColor="#fffbeb"
            icon={<IcoFolder color="#d97706" />}
          />
        </div>


        <div className="charts-row">

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Activity — Last 24 Hours</div>
                <div className="card-sub">Hourly breakdown by log level</div>
              </div>
              <div className="legend">
                {[
                  { label: 'Info',  color: '#99f6e4' },
                  { label: 'Warn',  color: '#fde68a' },
                  { label: 'Error', color: '#fecdd3' },
                ].map((l) => (
                  <span key={l.label} className="legend-item">
                    <span className="legend-dot" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            {loading
              ? <div className="chart-empty" style={{ flexDirection: 'column', gap: 12 }}><Spinner size={36} color1="#e2e8f0" color2="#14b8a6" /><span>Loading activity…</span></div>
              : <ActivityChart hourly={stats?.hourly} />
            }
          </div>

          {/* Donut chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Level Distribution</div>
                <div className="card-sub">Last 7 days</div>
              </div>
            </div>
            {loading
              ? <div className="chart-empty" style={{ height: 120, flexDirection: 'column', gap: 12 }}><Spinner size={30} color1="#e2e8f0" color2="#14b8a6" /><span>Loading…</span></div>
              : <DonutChart data={stats?.levelDistribution} />
            }
          </div>
        </div>


        {!loading && topProjects.length > 0 && (
          <div className="card" style={{ marginBottom: 22 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Most Active Projects Today</div>
                <div className="card-sub">Ranked by log volume</div>
              </div>
            </div>
            {topProjects.map((p) => {
              const pct    = (parseInt(p.total_today) / topMax) * 100;
              const errPct = parseInt(p.total_today) > 0
                ? ((parseInt(p.errors_today) + parseInt(p.fatals_today)) / parseInt(p.total_today)) * 100
                : 0;
              return (
                <div key={p.id} className="proj-bar" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="proj-bar-meta">
                    <span className="proj-bar-name">{p.name}</span>
                    <span className="proj-bar-count">
                      {parseInt(p.total_today).toLocaleString()} logs
                      {(parseInt(p.errors_today) + parseInt(p.fatals_today)) > 0 && (
                        <span style={{ color: '#be123c', marginLeft: 8 }}>
                          {parseInt(p.errors_today) + parseInt(p.fatals_today)} errors
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="proj-bar-track">
                    <div className="proj-bar-fill" style={{ width: `${pct}%`, background: '#99f6e4' }}>
                      {errPct > 0 && <div className="proj-bar-err" style={{ width: `${errPct}%`, background: '#f43f5e' }} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Your Projects</div>
              <div className="section-sub">Click a project to view its logs</div>
            </div>
          </div>


          {creating && (
            <div className="create-bar">
              <input
                autoFocus
                type="text"
                placeholder="Project name…"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setCreateErr(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="db-input"
              />
              <button className="btn-primary"  onClick={handleCreate}>Create</button>
              <button className="btn-ghost"    onClick={() => { setCreating(false); setCreateErr(''); setNewName(''); }}>Cancel</button>
            </div>
          )}
          {createErr && (
            <div style={{ marginBottom: 10, fontSize: 12, color: '#be123c', padding: '0 4px' }}>{createErr}</div>
          )}


          {loading ? (
            <div className="db-loading">
              <Spinner size={40} color1="#e2e8f0" color2="#289E49" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <div className="table-wrap">
              <div className="db-empty">
                <p>No projects yet. Create one to start ingesting logs.</p>
                <button className="btn-primary" onClick={() => { setCreating(true); setCreateErr(''); }}>
                  Create your first project
                </button>
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Logs today</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => {
                    const logsToday = parseInt(proj.logs_today || 0);
                    const hasWarn   = proj.storage_warning;
                    return (
                      <tr key={proj.id} onClick={() => navigate(`/projects/${proj.id}`)}>
                        <td><span className="tbl-name">{proj.name}</span></td>
                        <td className="tbl-muted">{logsToday.toLocaleString()}</td>
                        <td>
                          {hasWarn ? (
                            <span className="badge badge-warn"><span className="badge-dot" /> Storage warning</span>
                          ) : (
                            <span className="badge badge-ok"><span className="badge-dot" /> Healthy</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0d9488' }}>
                            View logs →
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default Dashboard;