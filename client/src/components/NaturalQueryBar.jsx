import { useState } from 'react';

const NaturalQueryBar = ({ onQuery, loading }) => {
  const [value, setValue] = useState('');
  const [interpretation, setInterpretation] = useState(null);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    const result = await onQuery(value);
    setInterpretation(result?.interpretation || null);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder='Ask in plain English — e.g. "show errors from billing in the last hour"'
            value={value}
            onChange={(e) => { setValue(e.target.value); if (!e.target.value) setInterpretation(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '9px 14px 9px 36px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8, fontSize: 13, outline: 'none',
              color: '#1e293b', fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#14b8a6'; e.target.style.background = '#f0fdfa'; }}
            onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '0 18px',
            background: loading ? '#f0fdfa' : '#0d9488',
            color: loading ? '#94a3b8' : '#fff',
            border: '1px solid',
            borderColor: loading ? '#e2e8f0' : '#0d9488',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#0f766e'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#0d9488'; }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Thinking…
            </span>
          ) : 'Ask AI'}
        </button>
      </div>
      {interpretation && (
        <div style={{ fontSize: 11, color: '#0d9488', marginTop: 6, paddingLeft: 2 }}>
          {interpretation}
        </div>
      )}
    </div>
  );
};

export default NaturalQueryBar;