import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { logout, getProjects, createProject, getDashboardStats } from '../api/client.js';


const Sparkline = ({ data, color = '#5A67D8', height = 40, width = 120 }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = [
    `0,${height}`,
    ...data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    }),
    `${width},${height}`,
  ].join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ActivityChart = ({ hourly }) => {
  const [hovered, setHovered] = useState(null);

  if (!hourly || hourly.length === 0) {
    return (
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: '12px' }}>
        No activity in the last 24 hours
      </div>
    );
  }

  // Fill all 24 hours — missing hours are zero
  const now = new Date();
  const filled = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now);
    hour.setHours(now.getHours() - 23 + i, 0, 0, 0);
    const key = hour.toISOString().slice(0, 13);
    const found = hourly.find((h) => new Date(h.hour).toISOString().slice(0, 13) === key);
    return {
      hour,
      label: hour.getHours() + ':00',
      total: parseInt(found?.total || 0),
      errors: parseInt(found?.errors || 0) + parseInt(found?.fatals || 0),
      warns: parseInt(found?.warns || 0),
    };
  });

  const max = Math.max(...filled.map((h) => h.total), 1);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
        {filled.map((h, i) => {
          const totalPct = (h.total / max) * 100;
          const errorPct = h.total > 0 ? (h.errors / h.total) * totalPct : 0;
          const warnPct = h.total > 0 ? (h.warns / h.total) * totalPct : 0;
          const infoPct = totalPct - errorPct - warnPct;

          return (
            <div
              key={i}
              style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && h.total > 0 && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#1a202c', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 10, marginBottom: '4px' }}>
                  {h.label} · {h.total} logs {h.errors > 0 ? `· ${h.errors} errors` : ''}
                </div>
              )}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {errorPct > 0 && (
                  <div style={{ height: `${errorPct}%`, background: hovered === i ? '#FC8181' : '#FEB2B2', borderRadius: '2px 2px 0 0', minHeight: errorPct > 0 ? '2px' : 0 }} />
                )}
                {warnPct > 0 && (
                  <div style={{ height: `${warnPct}%`, background: hovered === i ? '#F6E05E' : '#FEFCBF', minHeight: warnPct > 0 ? '2px' : 0 }} />
                )}
                {infoPct > 0 && (
                  <div style={{ height: `${infoPct}%`, background: hovered === i ? '#90CDF4' : '#BEE3F8', borderRadius: errorPct === 0 && warnPct === 0 ? '2px 2px 0 0' : 0, minHeight: infoPct > 0 ? '2px' : 0 }} />
                )}
                {h.total === 0 && (
                  <div style={{ height: '2px', background: '#f1f5f9', borderRadius: '2px' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>


      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {[0, 6, 12, 18, 23].map((i) => (
          <span key={i} style={{ fontSize: '10px', color: '#a0aec0' }}>
            {filled[i]?.label}
          </span>
        ))}
      </div>
    </div>
  );
};


const DonutChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);

  const COLORS = {
    debug: '#CBD5E0',
    info:  '#90CDF4',
    warn:  '#F6E05E',
    error: '#FC8181',
    fatal: '#9B2335',
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: '12px' }}>
        No data yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + parseInt(d.count), 0);
  const SIZE = 100;
  const RADIUS = 36;
  const INNER_RADIUS = 24;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const count = parseInt(d.count);
    const slice = (count / total) * 2 * Math.PI;
    const startAngle = angle;
    angle += slice;
    return { ...d, count, slice, startAngle, endAngle: angle };
  });

  const toXY = (a, r) => ({
    x: CX + r * Math.cos(a),
    y: CY + r * Math.sin(a),
  });

  const makeArc = (startAngle, endAngle, outerR, innerR) => {
    const start = toXY(startAngle, outerR);
    const end = toXY(endAngle, outerR);
    const innerStart = toXY(startAngle, innerR);
    const innerEnd = toXY(endAngle, innerR);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  };

  const hoveredSlice = hovered !== null ? slices[hovered] : null;
  const centerLabel = hoveredSlice
    ? { value: hoveredSlice.count.toLocaleString(), sub: hoveredSlice.level }
    : { value: total.toLocaleString(), sub: 'total' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
        {slices.map((slice, i) => (
          <path
            key={slice.level}
            d={makeArc(slice.startAngle, slice.endAngle, hovered === i ? RADIUS + 3 : RADIUS, INNER_RADIUS)}
            fill={COLORS[slice.level] || '#CBD5E0'}
            style={{ cursor: 'pointer', transition: 'd 0.15s ease' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a202c">
          {centerLabel.value}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="8" fill="#a0aec0">
          {centerLabel.sub}
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {slices.map((slice, i) => (
          <div
            key={slice.level}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: hovered !== null && hovered !== i ? 0.4 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[slice.level], flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#4a5568', textTransform: 'capitalize' }}>{slice.level}</span>
            <span style={{ fontSize: '11px', color: '#a0aec0', marginLeft: 'auto' }}>
              {((slice.count / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};


const StatCard = ({ label, value, sub, color = '#5A67D8', sparkData, alert }) => (
  <div style={{ background: '#fff', border: `1px solid ${alert ? '#FEB2B2' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ fontSize: '11px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: alert ? '#9B2335' : '#1a202c', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '3px' }}>{sub}</div>}
      </div>
      {sparkData && <Sparkline data={sparkData} color={color} />}
    </div>
  </div>
);

// ── Top projects bar ───────────────────────────────────────────────────────────
const TopProjectsBar = ({ projects, onNavigate }) => {
  if (!projects || projects.length === 0) return null;

  const max = Math.max(...projects.map((p) => parseInt(p.total_today)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {projects.map((p) => {
        const pct = (parseInt(p.total_today) / max) * 100;
        const errorPct = parseInt(p.total_today) > 0
          ? ((parseInt(p.errors_today) + parseInt(p.fatals_today)) / parseInt(p.total_today)) * 100
          : 0;

        return (
          <div
            key={p.id}
            onClick={() => onNavigate(p.id)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#2d3748' }}>{p.name}</span>
              <span style={{ fontSize: '11px', color: '#718096' }}>
                {parseInt(p.total_today).toLocaleString()} logs
                {parseInt(p.errors_today) + parseInt(p.fatals_today) > 0 && (
                  <span style={{ color: '#9B2335', marginLeft: '6px' }}>
                    {parseInt(p.errors_today) + parseInt(p.fatals_today)} errors
                  </span>
                )}
              </span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#EBF4FF', borderRadius: '99px', position: 'relative', transition: 'width 0.6s ease' }}>
                {errorPct > 0 && (
                  <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${errorPct}%`, background: '#FC8181', borderRadius: '0 99px 99px 0' }} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProjects(),
      getDashboardStats(),
    ])
      .then(([p, s]) => { setProjects(p); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject({ name: newName.trim() });
      setProjects((p) => [project, ...p]);
      setNewName('');
      setCreating(false);
    } catch (err) {
      console.error(err);
    }
  };


  const sparkData = stats?.hourly?.map((h) => parseInt(h.total)) || [];
  const errorSparkData = stats?.hourly?.map((h) => parseInt(h.errors) + parseInt(h.fatals)) || [];

  const fmt = (n) => parseInt(n || 0).toLocaleString();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a202c', margin: 0 }}>Log Explorer</h1>
          <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>Query your logs in plain English</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#4a5568' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#718096', background: 'none', border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>


      {(stats?.openAlerts > 0 || stats?.openAnomalies > 0) && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {stats.openAlerts > 0 && (
            <div style={{ flex: 1, minWidth: '200px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#9B2335', fontWeight: '500' }}>
                {stats.openAlerts} unacknowledged alert{stats.openAlerts !== 1 ? 's' : ''} in the last 24h
              </span>
            </div>
          )}
          {stats.openAnomalies > 0 && (
            <div style={{ flex: 1, minWidth: '200px', background: '#FEFCBF', border: '1px solid #F6E05E', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#744210', fontWeight: '500' }}>
                {stats.openAnomalies} anomal{stats.openAnomalies !== 1 ? 'ies' : 'y'} detected in the last 24h
              </span>
            </div>
          )}
        </div>
      )}


      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <StatCard
            label="Logs today"
            value={fmt(stats.totals.logs_24h)}
            sub="last 24 hours"
            color="#5A67D8"
            sparkData={sparkData}
          />
          <StatCard
            label="Errors today"
            value={fmt(stats.totals.errors_24h)}
            sub="error + fatal"
            color="#FC8181"
            sparkData={errorSparkData}
            alert={parseInt(stats.totals.errors_24h) > 0}
          />
          <StatCard
            label="Total logs"
            value={fmt(stats.totals.total_logs)}
            sub="all time"
            color="#68D391"
          />
          <StatCard
            label="Projects"
            value={fmt(stats.totals.total_projects)}
            sub={`${projects.filter((p) => p.storage_warning).length} with storage warning`}
            color="#F6AD55"
          />
        </div>
      )}


      {stats && parseInt(stats.totals.total_logs) > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '20px' }}>


          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748', margin: 0 }}>
                Activity — last 24 hours
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { label: 'info', color: '#BEE3F8' },
                  { label: 'warn', color: '#FEFCBF' },
                  { label: 'error', color: '#FEB2B2' },
                ].map((l) => (
                  <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#a0aec0' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, display: 'inline-block' }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <ActivityChart hourly={stats.hourly} />
          </div>

  
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748', margin: '0 0 16px' }}>
              Level distribution — 7 days
            </h3>
            <DonutChart data={stats.levelDistribution} />
          </div>

        </div>
      )}


      {stats?.topProjects?.length > 0 && parseInt(stats.totals.logs_24h) > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748', margin: '0 0 16px' }}>
            Top projects today
          </h3>
          <TopProjectsBar projects={stats.topProjects} onNavigate={(id) => navigate(`/projects/${id}`)} />
        </div>
      )}


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748', margin: 0 }}>Projects</h2>
        <button
          onClick={() => setCreating(true)}
          style={{ padding: '7px 14px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >
          New project
        </button>
      </div>

      {creating && (
        <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '12px', display: 'flex', gap: '10px' }}>
          <input
            autoFocus type="text" placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
          <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Create</button>
          <button onClick={() => setCreating(false)} style={{ padding: '8px 12px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#718096', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#a0aec0', fontSize: '14px', padding: '40px 0' }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
          <p style={{ color: '#a0aec0', fontSize: '14px', margin: '0 0 16px' }}>No projects yet.</p>
          <button onClick={() => setCreating(true)} style={{ padding: '9px 20px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Create your first project
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#a0aec0'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>{project.name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '3px' }}>
                  {parseInt(project.logs_today || 0).toLocaleString()} logs today
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {project.storage_warning && (
                  <span style={{ fontSize: '11px', background: '#FEFCBF', color: '#744210', border: '1px solid #F6E05E', borderRadius: '99px', padding: '2px 8px' }}>
                    Storage warning
                  </span>
                )}
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;