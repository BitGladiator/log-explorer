import { useState } from 'react';

const LEVEL_COLORS = {
  warn:  '#744210',
  error: '#9B2335',
  fatal: '#fff',
};
const LEVEL_BG = {
  warn:  '#FEFCBF',
  error: '#FFF5F5',
  fatal: '#9B2335',
};

const ClusterCard = ({ cluster, onAnalyze }) => {
  const [analysis, setAnalysis] = useState(
    cluster.ai_summary ? { summary: cluster.ai_summary, likely_cause: cluster.ai_likely_cause } : null
  );
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (analysis) return;
    setLoading(true);
    try {
      const result = await onAnalyze(cluster.id);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts) => {
    const diffMin = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: LEVEL_BG[cluster.level], color: LEVEL_COLORS[cluster.level], borderRadius: '4px', padding: '2px 7px', flexShrink: 0 }}>
            {cluster.level}
          </span>
          {cluster.service && (
            <span style={{ fontSize: '11px', color: '#5a67d8', fontWeight: '500', flexShrink: 0 }}>
              {cluster.service}
            </span>
          )}
          <span style={{ fontSize: '13px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
            {cluster.representative_message}
          </span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#9B2335', background: '#FFF5F5', borderRadius: '99px', padding: '2px 10px', flexShrink: 0 }}>
          ×{cluster.occurrence_count}
        </span>
      </div>

      <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: analysis || loading ? '10px' : 0 }}>
        First seen {formatTime(cluster.first_seen)} · Last seen {formatTime(cluster.last_seen)}
      </div>

      {!analysis && !loading && (
        <button
          onClick={handleAnalyze}
          style={{ fontSize: '12px', color: '#5A67D8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Analyze with AI →
        </button>
      )}

      {loading && (
        <div style={{ fontSize: '12px', color: '#a0aec0' }}>Analyzing...</div>
      )}

      {analysis && (
        <div style={{ background: '#F7FAFF', border: '1px solid #C3DAFE', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
          <div style={{ fontSize: '12px', color: '#2d3748', lineHeight: 1.5, marginBottom: '6px' }}>
            {analysis.summary}
          </div>
          <div style={{ fontSize: '11px', color: '#5A67D8', fontWeight: '500' }}>
            Likely cause: {analysis.likely_cause}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterCard;