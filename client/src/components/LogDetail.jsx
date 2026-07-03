const LEVEL = {
  debug: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
  info:  { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  warn:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  error: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  fatal: { bg: "#fff1f2", color: "#9f1239", border: "#fda4af" },
};

const LogDetail = ({ log, onClose }) => {
  if (!log) return null;
  const s = LEVEL[log.level] || LEVEL.info;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.35)",
        zIndex: 300,
        display: "flex", justifyContent: "flex-end",
      }}
    >
     
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, height: "100%",
          background: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(15,23,42,0.1)",
          overflowY: "auto",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
     
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
          flexShrink: 0,
          background: "#f8fafc",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
              borderRadius: 6, padding: "3px 9px",
            }}>
              {log.level}
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>
              {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 7, cursor: "pointer",
              color: "#64748b", fontSize: 18,
              width: 30, height: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          >
            ×
          </button>
        </div>

       
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 10,
          }}>
            Message
          </div>
          <pre style={{
            fontSize: 13, color: "#1e293b", lineHeight: 1.65,
            fontFamily: "ui-monospace, 'Cascadia Code', monospace",
            wordBreak: "break-word", whiteSpace: "pre-wrap", margin: 0,
            background: "#f8fafc", border: "1px solid #f1f5f9",
            borderRadius: 8, padding: "12px 14px",
          }}>
            {log.message}
          </pre>
        </div>

       
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 12,
          }}>
            Details
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <DetailRow label="Timestamp" value={new Date(log.timestamp).toISOString()} />
            {log.service && <DetailRow label="Service"   value={log.service} />}
            {log.host    && <DetailRow label="Host"      value={log.host}    />}
            <DetailRow label="Log ID"   value={String(log.id)} />
          </div>
        </div>

       
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div style={{ padding: "18px 20px", flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 10,
            }}>
              Metadata
            </div>
            <pre style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10, padding: "14px 16px",
              fontSize: 12, color: "#475569",
              overflowX: "auto", margin: 0,
              fontFamily: "ui-monospace, 'Cascadia Code', monospace",
              lineHeight: 1.6,
            }}>
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12 }}>
    <span style={{ color: "#94a3b8", flexShrink: 0 }}>{label}</span>
    <span style={{
      color: "#334155",
      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
      textAlign: "right", wordBreak: "break-all",
    }}>
      {value}
    </span>
  </div>
);

export default LogDetail;
