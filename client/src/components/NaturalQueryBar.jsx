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
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder='Try "show errors from billing in the last hour"'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%', padding: '9px 14px', border: '1px solid #C3DAFE', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#F7FAFF' }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: '0 18px', background: '#5A67D8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
      {interpretation && (
        <div style={{ fontSize: '11px', color: '#5A67D8', marginTop: '6px', paddingLeft: '2px' }}>
          {interpretation}
        </div>
      )}
    </div>
  );
};

export default NaturalQueryBar;