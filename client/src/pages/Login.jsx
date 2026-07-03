import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #f4f6f9;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
  }
  .login-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    background: #f8fafc;
    color: #1e293b;
    transition: border-color 0.15s, background 0.15s;
  }
  .login-input::placeholder { color: #94a3b8; }
  .login-input:focus { border-color: #14b8a6; background: #f0fdfa; }
`;

const Login = () => {
  const { setUser } = useAuth();
  const navigate    = useNavigate();
  const [mode,    setMode]    = useState('login');
  const [form,    setForm]    = useState({ email: '', password: '', name: '' });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const fn   = mode === 'login' ? login : register;
      const user = await fn(form);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '24px',
        background: '#f4f6f9',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
           <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>
            Log Explorer
          </span>
        </div>


        <div style={{
          width: '100%', maxWidth: 380,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            {mode === 'login'
              ? 'Sign in to your Log Explorer account'
              : 'Start monitoring your application logs'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 5 }}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="login-input"
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="login-input"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="login-input"
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14,
              padding: '9px 12px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 8,
              fontSize: 13,
              color: '#be123c',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: 20,
              padding: '11px',
              background: loading ? '#99f6e4' : '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(13,148,136,0.3)',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0' }} />

          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            style={{
              width: '100%',
              padding: '8px',
              background: 'none',
              border: 'none',
              fontSize: 13,
              color: '#64748b',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <span style={{ color: '#0d9488', fontWeight: 600 }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Login;