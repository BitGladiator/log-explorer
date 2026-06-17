const LEVEL_STYLES = {
  debug: { bg: "#F7FAFC", color: "#718096" },
  info: { bg: "#EBF8FF", color: "#2B6CB0" },
  warn: { bg: "#FEFCBF", color: "#744210" },
  error: { bg: "#FFF5F5", color: "#9B2335" },
  fatal: { bg: "#9B2335", color: "#fff" },
};

const LogDetail = ({ log, onClose }) => {
  if (!log) return null;
  const style = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.15)",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "420px",
          height: "100%",
          background: "#fff",
          borderLeft: "1px solid #e2e8f0",
          padding: "24px",
          overflowY: "auto",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              background: style.bg,
              color: style.color,
              borderRadius: "4px",
              padding: "3px 10px",
            }}
          >
            {log.level}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a0aec0",
              fontSize: "18px",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#1a202c",
            lineHeight: 1.5,
            marginBottom: "20px",
            fontFamily: "ui-monospace, monospace",
            wordBreak: "break-word",
          }}
        >
          {log.message}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <DetailRow
            label="Timestamp"
            value={new Date(log.timestamp).toISOString()}
          />
          {log.service && <DetailRow label="Service" value={log.service} />}
          {log.host && <DetailRow label="Host" value={log.host} />}
          <DetailRow label="Log ID" value={log.id} />
        </div>

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <h4
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#718096",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "0 0 8px",
              }}
            >
              Metadata
            </h4>
            <pre
              style={{
                background: "#F7FAFC",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                color: "#2d3748",
                overflowX: "auto",
                margin: 0,
              }}
            >
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "12px",
    }}
  >
    <span style={{ color: "#a0aec0" }}>{label}</span>
    <span
      style={{
        color: "#2d3748",
        fontFamily: "ui-monospace, monospace",
        textAlign: "right",
      }}
    >
      {value}
    </span>
  </div>
);

export default LogDetail;
