const SEVERITY_STYLES = {
  low: { bg: "#F7FAFC", color: "#718096", border: "#e2e8f0" },
  medium: { bg: "#FEFCBF", color: "#744210", border: "#F6E05E" },
  high: { bg: "#FFF5F5", color: "#9B2335", border: "#FEB2B2" },
};

const TYPE_LABELS = {
  volume_spike: "Volume spike",
  volume_drop: "Volume drop",
  new_service: "New service",
  level_shift: "Error rate shift",
};

const AnomalyCard = ({ anomaly, onAck }) => {
  const style = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low;

  const formatTime = (ts) => {
    const diffMin = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  return (
    <div
      style={{
        background: anomaly.acknowledged ? "#fff" : style.bg,
        border: `1px solid ${anomaly.acknowledged ? "#e2e8f0" : style.border}`,
        borderRadius: "10px",
        padding: "14px 16px",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              textTransform: "uppercase",
              color: style.color,
              background: "#fff",
              border: `1px solid ${style.border}`,
              borderRadius: "4px",
              padding: "2px 7px",
            }}
          >
            {anomaly.severity}
          </span>
          <span
            style={{ fontSize: "12px", fontWeight: "500", color: "#4a5568" }}
          >
            {TYPE_LABELS[anomaly.anomaly_type] || anomaly.anomaly_type}
          </span>
        </div>
        {!anomaly.acknowledged && (
          <button
            onClick={() => onAck(anomaly.id)}
            style={{
              fontSize: "11px",
              color: "#3182CE",
              background: "none",
              border: "1px solid #BEE3F8",
              borderRadius: "6px",
              padding: "3px 10px",
              cursor: "pointer",
            }}
          >
            Acknowledge
          </button>
        )}
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "#1a202c",
          margin: "0 0 6px",
          lineHeight: 1.5,
        }}
      >
        {anomaly.description}
      </p>

      {anomaly.ai_explanation && (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${style.border}`,
            borderRadius: "8px",
            padding: "10px 12px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#718096",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "4px",
            }}
          >
            AI explanation
          </div>
          <div style={{ fontSize: "12px", color: "#2d3748", lineHeight: 1.5 }}>
            {anomaly.ai_explanation}
          </div>
        </div>
      )}

      <div style={{ fontSize: "11px", color: "#a0aec0", marginTop: "8px" }}>
        {formatTime(anomaly.detected_at)}
      </div>
    </div>
  );
};

export default AnomalyCard;
