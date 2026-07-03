const SEVERITY_STYLES = {
  low:    { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0",  dot: "#94a3b8" },
  medium: { bg: "#fffbeb", color: "#b45309", border: "#fde68a",  dot: "#f59e0b" },
  high:   { bg: "#fff1f2", color: "#be123c", border: "#fecdd3",  dot: "#f43f5e" },
};

const TYPE_LABELS = {
  volume_spike: "Volume spike",
  volume_drop:  "Volume drop",
  new_service:  "New service",
  level_shift:  "Error rate shift",
};

const AnomalyCard = ({ anomaly, onAck }) => {
  const s = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low;

  const formatTime = (ts) => {
    const diffMin = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMin < 1)  return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  return (
    <div style={{
      background: anomaly.acknowledged ? "#fff" : s.bg,
      border: `1px solid ${anomaly.acknowledged ? "#e2e8f0" : s.border}`,
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: 10,
      fontFamily: "'Inter', system-ui, sans-serif",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Severity dot + badge */}
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block", flexShrink: 0 }} />
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
            color: s.color, background: "#fff",
            border: `1px solid ${s.border}`,
            borderRadius: 5, padding: "2px 7px",
          }}>
            {anomaly.severity}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
            {TYPE_LABELS[anomaly.anomaly_type] || anomaly.anomaly_type}
          </span>
        </div>
        {!anomaly.acknowledged && (
          <button
            onClick={() => onAck(anomaly.id)}
            style={{
              fontSize: 11, color: "#0d9488", fontWeight: 600,
              background: "#f0fdfa", border: "1px solid #99f6e4",
              borderRadius: 6, padding: "3px 10px", cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ccfbf1")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0fdfa")}
          >
            Acknowledge
          </button>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: "#1e293b", margin: "0 0 6px", lineHeight: 1.55 }}>
        {anomaly.description}
      </p>

      {/* AI explanation */}
      {anomaly.ai_explanation && (
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "10px 12px", marginTop: 10,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 5,
          }}>
            AI explanation
          </div>
          <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.55 }}>
            {anomaly.ai_explanation}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
        {formatTime(anomaly.detected_at)}
      </div>
    </div>
  );
};

export default AnomalyCard;
