import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';

/* ─── inline styles injected once ─────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'IBM Plex Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
    background: #f7f9f7;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── fade-in card ── */
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .login-card {
    animation: cardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* ── input wrapper ── */
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-icon {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    pointer-events: none;
    display: flex;
    align-items: center;
    transition: color 0.18s;
  }
  .input-icon-right {
    position: absolute;
    right: 10px;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #94a3b8;
    border-radius: 4px;
    transition: color 0.18s;
    line-height: 0;
  }
  .input-icon-right:hover { color: #475569; }

  /* ── text input ── */
  .login-input {
    width: 100%;
    padding: 10px 12px 10px 38px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    background: #ffffff;
    color: #0f172a;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    line-height: 1.5;
  }
  .login-input.has-right { padding-right: 38px; }
  .login-input::placeholder { color: #94a3b8; }
  .login-input:hover:not(:focus) { border-color: #cbd5e1; }
  .login-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
    background: #ffffff;
  }
  .login-input:focus ~ .input-icon,
  .input-wrapper:focus-within .input-icon {
    color: #10b981;
  }

  /* ── primary button ── */
  .btn-primary {
    width: 100%;
    padding: 11px 16px;
    background: #10b981;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    letter-spacing: 0.01em;
    box-shadow: 0 1px 4px rgba(16,185,129,0.25), 0 4px 12px rgba(16,185,129,0.15);
    transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
    position: relative;
    overflow: hidden;
  }
  .btn-primary:hover:not(:disabled) {
    background: #0ea471;
    box-shadow: 0 2px 8px rgba(16,185,129,0.3), 0 6px 20px rgba(16,185,129,0.2);
    transform: translateY(-1px);
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(16,185,129,0.2);
  }
  .btn-primary:disabled {
    background: #a7f3d0;
    box-shadow: none;
    cursor: not-allowed;
  }

  /* ── ghost toggle button ── */
  .btn-ghost {
    background: none;
    border: none;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 13px;
    color: #64748b;
    transition: color 0.15s;
  }
  .btn-ghost:hover { color: #0f172a; }

  /* ── loading spinner ── */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spinner {
    width: 15px;
    height: 15px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  /* ── divider ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: #f1f5f9;
  }
`;

/* ─── SVG icons (inline, no extra dependency) ─────────────────────────── */
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

const IconLog = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
    <line x1="8" y1="9" x2="10" y2="9"/>
  </svg>
);

/* ─── component ───────────────────────────────────────────────────────── */
const Login = () => {
  const { setUser }  = useAuth();
  const navigate     = useNavigate();
  const [mode,    setMode]    = useState('login');
  const [form,    setForm]    = useState({ email: '', password: '', name: '' });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  /* reset show-password when switching modes */
  useEffect(() => { setShowPw(false); setError(null); }, [mode]);

  const handleSubmit = async () => {
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
    <>
      <style>{CSS}</style>

      {/* ── page shell ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: 'linear-gradient(160deg, #f0faf6 0%, #f7f9f8 50%, #f5f7fa 100%)',
      }}>

        {/* ── wordmark ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconLog />
            <span style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}>
              Log Explorer
            </span>
          </div>
          <p style={{
            fontSize: 13,
            color: '#64748b',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            Collect, search and analyze application logs from one place.
          </p>
        </div>

        {/* ── auth card ── */}
        <div
          className="login-card"
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#ffffff',
            border: '1px solid #e8edf2',
            borderRadius: 22,
            padding: '36px 36px 32px',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04), 0 12px 40px rgba(15,23,42,0.07)',
          }}
        >

          {/* heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.4px',
              marginBottom: 6,
              lineHeight: 1.2,
            }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.5, fontWeight: 400 }}>
              {mode === 'login'
                ? 'Sign in to your Log Explorer account to continue.'
                : 'Start monitoring your application logs today.'}
            </p>
          </div>

          {/* ── form fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* name — register only */}
            {mode === 'register' && (
              <div>
                <label style={labelStyle}>Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconUser /></span>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => field('name', e.target.value)}
                    className="login-input"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                  className="login-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconLock /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••"
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
            </div>
          </div>

          {/* error banner */}
          {error && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 10,
              fontSize: 13,
              color: '#be123c',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* submit */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 22 }}
          >
            {loading
              ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              )
              : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>

          {/* divider + toggle */}
          <div className="divider">
            <div className="divider-line" />
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className="btn-ghost"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

        </div>

        {/* subtle footer */}
        <p style={{
          marginTop: 28,
          fontSize: 12,
          color: '#94a3b8',
          textAlign: 'center',
          letterSpacing: '0.01em',
        }}>
          © {new Date().getFullYear()} Log Explorer
        </p>

      </div>
    </>
  );
};

/* shared label style */
const labelStyle = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
  letterSpacing: '0.01em',
};

export default Login;