import { useState } from 'react';
import Spinner from './Spinner.jsx';

const LEVEL_STYLE = {
  warn:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  error: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  fatal: { bg: "#fff1f2", color: "#9f1239", border: "#fda4af" },
};

const ClusterCard = ({ cluster, onAnalyze }) => {
  const [analysis, setAnalysis] = useState(
    cluster.ai_summary
      ? { summary: cluster.ai_summary, likely_cause: cluster.ai_likely_cause }
      : null
  );
  const [loading, setLoading] = useState(false);

  const s = LEVEL_STYLE[cluster.level] || LEVEL_STYLE.error;

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
    if (diffMin < 1)  return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#cbd5e1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: "0.08em",
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 5, padding: '2px 8px', flexShrink: 0,
          }}>
            {cluster.level}
          </span>
          {cluster.service && (
            <span style={{
              fontSize: 11, color: "#0d9488", fontWeight: 600, flexShrink: 0,
              background: "#f0fdfa", border: "1px solid #99f6e4",
              borderRadius: 5, padding: "1px 7px",
            }}>
              {cluster.service}
            </span>
          )}
          <span style={{
            fontSize: 12.5, color: "#334155",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: "ui-monospace, 'Cascadia Code', monospace",
          }}>
            {cluster.representative_message}
          </span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#be123c",
          background: "#fff1f2", border: "1px solid #fecdd3",
          borderRadius: 99, padding: "2px 10px", flexShrink: 0,
        }}>
          ×{cluster.occurrence_count}
        </span>
      </div>

   
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: analysis || loading ? 10 : 0 }}>
        First seen {formatTime(cluster.first_seen)} · Last seen {formatTime(cluster.last_seen)}
      </div>

  
      {!analysis && !loading && (
        <button
          onClick={handleAnalyze}
          style={{
            fontSize: 12, color: "#0d9488", fontWeight: 600,
            background: "#f0fdfa", border: "1px solid #99f6e4",
            borderRadius: 7, padding: "5px 12px",
            cursor: 'pointer', fontFamily: 'inherit',
            marginTop: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ccfbf1")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0fdfa")}
        >
          Analyze with AI →
        </button>
      )}

      {loading && (
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <Spinner size={20} color1="#e2e8f0" color2="#0d9488" />
          Analyzing…
        </div>
      )}

      {analysis && (
        <div style={{
          background: "#f0fdfa",
          border: "1px solid #99f6e4",
          borderRadius: 10, padding: "12px 14px", marginTop: 10,
        }}>
          <div style={{ fontSize: 12.5, color: "#1e293b", lineHeight: 1.6, marginBottom: 8 }}>
            {analysis.summary}
          </div>
          <div style={{ fontSize: 11, color: "#0d9488", fontWeight: 600 }}>
            Likely cause: {analysis.likely_cause}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterCard;