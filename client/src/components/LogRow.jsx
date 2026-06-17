const LEVEL_STYLES = {
  debug: { bg: "#F7FAFC", color: "#718096" },
  info: { bg: "#EBF8FF", color: "#2B6CB0" },
  warn: { bg: "#FEFCBF", color: "#744210" },
  error: { bg: "#FFF5F5", color: "#9B2335" },
  fatal: { bg: "#9B2335", color: "#fff" },
};

const LogRow = ({ log, onClick }) => {
  const style = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;

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
        alignItems: "flex-start",
        gap: "10px",
        padding: "7px 12px",
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: "12.5px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "#a0aec0", flexShrink: 0, width: "92px" }}>
        {formatTime(log.timestamp)}
      </span>
      <span
        style={{
          flexShrink: 0,
          width: "52px",
          textAlign: "center",
          fontSize: "10px",
          fontWeight: "700",
          textTransform: "uppercase",
          background: style.bg,
          color: style.color,
          borderRadius: "4px",
          padding: "1px 0",
        }}
      >
        {log.level}
      </span>
      {log.service && (
        <span style={{ color: "#5a67d8", flexShrink: 0, fontWeight: "500" }}>
          [{log.service}]
        </span>
      )}
      <span
        style={{
          color: "#1a202c",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {log.message}
      </span>
    </div>
  );
};

export default LogRow;
