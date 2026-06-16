import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';

const Login = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = mode === 'login' ? login : register;
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '8px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', margin: '0 0 24px' }}>
        Log Explorer
      </h1>

      <div style={{ width: '360px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c', margin: '0 0 20px' }}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h2>

        {mode === 'register' && (
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }}
        />

        {error && (
          <div style={{ fontSize: '13px', color: '#C53030', marginBottom: '12px' }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          style={{ width: '100%', marginTop: '12px', padding: '8px', background: 'none', border: 'none', fontSize: '13px', color: '#718096', cursor: 'pointer' }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

export default Login;