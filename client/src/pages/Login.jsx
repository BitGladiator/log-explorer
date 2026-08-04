import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import './login.css';

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

const IconLog = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
    <line x1="8" y1="9" x2="10" y2="9"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const triggerRipple = (e) => {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const rect = btn.getBoundingClientRect();
  circle.style.width = circle.style.height = diameter + 'px';
  circle.style.left = e.clientX - rect.left - diameter / 2 + 'px';
  circle.style.top  = e.clientY - rect.top  - diameter / 2 + 'px';
  circle.classList.add('ripple');
  btn.querySelector('.ripple')?.remove();
  btn.appendChild(circle);
};

const getFormattedTime = (offsetSeconds = 0) => {
  const d = new Date(Date.now() + offsetSeconds * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const LOG_POOL = [
  {
    segments: [
      { cls: 'terminal-log-method',    text: 'GET   ' },
      { cls: 'terminal-log-path',      text: '/api/orders              ' },
      { cls: 'terminal-log-status-ok', text: '200  ' },
      { cls: 'terminal-log-dim',       text: '84ms' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'Cache hit                               ' },
      { cls: 'terminal-log-status-ok', text: 'Redis' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'Worker #3 completed job' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'AI grouped related errors' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-method',    text: 'POST  ' },
      { cls: 'terminal-log-path',      text: '/api/logs                ' },
      { cls: 'terminal-log-status-ok', text: '201  ' },
      { cls: 'terminal-log-dim',       text: '11ms' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-status-ok', text: 'Health check passed' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'PostgreSQL query executed        ' },
      { cls: 'terminal-log-dim',       text: '12ms' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-status-ok', text: 'Authentication successful' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'Anomaly detection scan complete' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-method',    text: 'GET   ' },
      { cls: 'terminal-log-path',      text: '/api/projects            ' },
      { cls: 'terminal-log-status-ok', text: '200  ' },
      { cls: 'terminal-log-dim',       text: '18ms' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'Log ingestion rate              ' },
      { cls: 'terminal-log-status-ok', text: '4,200 events/sec' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-status-warn', text: 'High memory alert       ' },
      { cls: 'terminal-log-dim',         text: 'service: worker-02' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-neutral',   text: 'Scheduled cleanup ran' },
    ],
  },
  {
    segments: [
      { cls: 'terminal-log-method',    text: 'GET   ' },
      { cls: 'terminal-log-path',      text: '/api/users               ' },
      { cls: 'terminal-log-status-ok', text: '200  ' },
      { cls: 'terminal-log-dim',       text: '29ms' },
    ],
  },
];

const MAX_VISIBLE = 9;

const LiveTerminal = () => {
  const [entries, setEntries] = useState(() =>
    LOG_POOL.slice(0, 6).map((e, i) => ({
      ...e,
      time: getFormattedTime(-((5 - i) * 3)),
      uid: i,
    }))
  );
  const nextUid = useRef(6);
  const nextIdx = useRef(6);

  useEffect(() => {
    const iv = setInterval(() => {
      const idx = nextIdx.current % LOG_POOL.length;
      nextIdx.current += 1;
      const uid = nextUid.current++;
      const time = getFormattedTime(0);
      setEntries(prev => {
        const next = [...prev, { ...LOG_POOL[idx], time, uid }];
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="terminal-window">
      <div className="terminal-titlebar">
        <div className="terminal-dots">
          <div className="terminal-dot terminal-dot-red" />
          <div className="terminal-dot terminal-dot-yellow" />
          <div className="terminal-dot terminal-dot-green" />
        </div>
        <span className="terminal-title-text">log-explorer — live stream</span>
      </div>

      <div className="terminal-body">
        {entries.map((entry, i) => {
          const fading = entries.length >= MAX_VISIBLE - 1 && i < entries.length - (MAX_VISIBLE - 2);
          return (
            <div
              key={entry.uid}
              className={`terminal-log-line${fading ? ' fading' : ''}`}
            >
              <span className="terminal-log-time">[{entry.time}]</span>
              {entry.segments.map((seg, j) => (
                <span key={j} className={seg.cls}>{seg.text}</span>
              ))}
            </div>
          );
        })}
        <div className="terminal-cursor-line">
          <span className="terminal-prompt-symbol">$</span>
          <span className="terminal-cursor" />
        </div>
      </div>

      <div className="terminal-live-row" style={{ padding: '0 24px 18px' }}>
        <div className="terminal-live-indicator">
          <div className="terminal-live-dot" />
          <span className="terminal-live-label">Live</span>
        </div>
        <span className="terminal-live-rate">4,200 events / sec</span>
      </div>
    </div>
  );
};

const Login = () => {
  const { setUser }  = useAuth();
  const navigate     = useNavigate();
  const [mode,       setMode]       = useState('login');
  const [form,       setForm]       = useState({ email: '', password: '', name: '' });
  const [error,      setError]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  useEffect(() => { setShowPw(false); setError(null); }, [mode]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const fn   = mode === 'login' ? login : register;
      const user = await fn(form);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="login-root">

      <div className="login-bg">
        <div className="login-bg-glow-1" />
        <div className="login-bg-glow-2" />
        <div className="login-bg-grid" />
        <div className="login-bg-noise" />
      </div>

      <div className="page-brand">
        <IconLog size={16} />
        <span className="page-brand-name">Log Explorer</span>
      </div>

      <div className="left-panel">

        <div className="auth-panel">
          <div className="auth-header">
            <h1 className="auth-title">
              {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Sign in to monitor applications and explore your logs.'
                : 'Start collecting and analyzing logs across every service you run.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>

            {mode === 'register' && (
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconUser /></span>
                  <input
                    type="text"
                    placeholder="your name"
                    value={form.name}
                    onChange={e => field('name', e.target.value)}
                    className="login-input"
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="field-group">
              <label className="field-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input
                  type="email"
                  placeholder="developer@company.com"
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  className="login-input"
                  autoComplete="email"
                  autoFocus={mode === 'login'}
                />
                {emailFocus && form.email === '' && (
                  <div className="blink-cursor" />
                )}
              </div>
            </div>

            <div className="field-group">
              <div className="pw-label-row">
                <label className="field-label">Password</label>
                {mode === 'login' && (
                  <button type="button" className="forgot-link">Forgot password?</button>
                )}
              </div>
              <div className="input-wrapper">
                <span className="input-icon"><IconLock /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={e => field('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="login-input has-right"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {mode === 'login' && form.password.length > 0 && (
                <p className="enter-hint">
                  <kbd>Enter</kbd> to continue
                </p>
              )}
            </div>

            {error && (
              <div className="error-banner">
                <IconAlertCircle />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              onClick={triggerRipple}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  {mode === 'login' ? 'Authenticating...' : 'Creating workspace...'}
                </>
              ) : (mode === 'login' ? 'Continue' : 'Create workspace')}
            </button>

          </form>

          <div className="mode-switch">
            <span className="mode-switch-text">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              className="btn-mode-link"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <div className="left-footer">
          <span className="footer-copyright">
            &copy; {new Date().getFullYear()} Log Explorer
          </span>
          <span className="footer-sep">·</span>
          <button type="button" className="footer-link">Privacy</button>
          <span className="footer-sep">·</span>
          <button type="button" className="footer-link">Terms</button>
        </div>

      </div>

      <div className="right-panel">

        <div className="right-tagline">
          <div className="right-tagline-headline">
            Search less.<br />Understand more.
          </div>
          <div className="right-tagline-sub">
            Log Explorer collects, filters, searches and analyzes logs from every service in one intelligent workspace.
          </div>
        </div>

        <LiveTerminal />

      </div>

    </div>
  );
};

export default Login;