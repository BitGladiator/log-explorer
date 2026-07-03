const LEVEL = {
  debug: { bg: "#f1f5f9",  color: "#64748b", border: "#e2e8f0",  leftBar: "#94a3b8" },
  info:  { bg: "#eff6ff",  color: "#2563eb", border: "#bfdbfe",  leftBar: "#3b82f6" },
  warn:  { bg: "#fffbeb",  color: "#b45309", border: "#fde68a",  leftBar: "#f59e0b" },
  error: { bg: "#fff1f2",  color: "#be123c", border: "#fecdd3",  leftBar: "#f43f5e" },
  fatal: { bg: "#fff1f2",  color: "#9f1239", border: "#fda4af",  leftBar: "#e11d48" },
};

const LogRow = ({ log, onClick }) => {
  const s = LEVEL[log.level] || LEVEL.info;

  const formatTime = (ts) => {
    const d = new Date(ts);
    return (
      d.toLocaleTimeString("en-US", { hour12: false }) +
      "." +
      String(d.getMilliseconds()).padStart(3, "0")
    );
  };

  return (
    <div
      onClick={() => onClick(log)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 20px 6px 16px",
        borderBottom: "1px solid #f1f5f9",
        borderLeft: `3px solid transparent`,
        cursor: "pointer",
        fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
        fontSize: "12.5px",
        transition: "background 0.1s, border-left-color 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f8fafc";
        e.currentTarget.style.borderLeftColor = s.leftBar;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderLeftColor = "transparent";
      }}
    >
    
      <span style={{ color: "#94a3b8", flexShrink: 0, width: 96, letterSpacing: "0.01em", fontSize: 11.5 }}>
        {formatTime(log.timestamp)}
      </span>

    
      <span style={{
        flexShrink: 0, width: 48, textAlign: "center",
        fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 5, padding: "2px 0",
      }}>
        {log.level}
      </span>

     
      {log.service && (
        <span style={{
          color: "#0d9488", flexShrink: 0, fontWeight: 600, fontSize: 11,
          background: "#f0fdfa",
          border: "1px solid #99f6e4",
          borderRadius: 5, padding: "1px 7px",
        }}>
          {log.service}
        </span>
      )}

     
      <span style={{
        color: "#334155",
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {log.message}
      </span>
    </div>
  );
};

export default LogRow;
