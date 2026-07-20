import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProjects,
  rotateApiKey,
  deleteProject,
  getStorageStats,
  updateRetentionPolicy,
  triggerCleanup,
} from "../api/client.js";
import Spinner from "../components/Spinner.jsx";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'IBM Plex Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
    background: #f4f6f9;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
  }
  .ps-input {
    width: 100%; padding: 8px 12px;
    border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13px; font-family: inherit;
    background: #fff; color: #1e293b; outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .ps-input:focus { border-color: #14b8a6; background: #f0fdfa; }
  .ps-select {
    width: 100%; padding: 8px 12px;
    border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13px; font-family: inherit;
    background: #fff; color: #1e293b;
    cursor: pointer; outline: none;
    transition: border-color 0.15s;
  }
  .ps-select:focus { border-color: #14b8a6; }
`;

const RETENTION_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "1 year" },
  { value: null, label: "Keep forever" },
];

const LEVEL_COLORS_BAR = {
  debug: "#cbd5e1",
  info: "#60a5fa",
  warn: "#fbbf24",
  error: "#f87171",
  fatal: "#dc2626",
};
const LEVEL_COLORS_TEXT = {
  debug: "#64748b",
  info: "#2563eb",
  warn: "#b45309",
  error: "#be123c",
  fatal: "#9f1239",
};

const Card = ({ children, danger }) => (
  <div
    style={{
      background: danger ? "#fff1f2" : "#fff",
      border: `1px solid ${danger ? "#fecdd3" : "#e2e8f0"}`,
      borderRadius: 12,
      padding: "20px",
      marginBottom: 16,
    }}
  >
    {children}
  </div>
);

const CardHeader = ({ children, danger }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      color: danger ? "#be123c" : "#94a3b8",
      marginBottom: 14,
    }}
  >
    {children}
  </div>
);

const StatItem = ({ label, value }) => (
  <div
    style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: 12,
    }}
  >
    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
      {value}
    </div>
  </div>
);

const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [savingRetention, setSavingRetention] = useState(false);
  const [savedRetention, setSavedRetention] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    getProjects().then((projects) => {
      const p = projects.find((p) => String(p.id) === String(projectId));
      setProject(p);
    });
    getStorageStats(projectId)
      .then((stats) => {
        setStorageStats(stats);
        setRetentionDays(stats.retention_days);
      })
      .catch(console.error);
  }, [projectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(project.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRotate = async () => {
    if (
      !confirm(
        "Rotating will invalidate the current key immediately. Continue?"
      )
    )
      return;
    setRotating(true);
    try {
      const updated = await rotateApiKey(projectId);
      setProject((p) => ({ ...p, api_key: updated.api_key }));
    } finally {
      setRotating(false);
    }
  };

  const handleSaveRetention = async () => {
    setSavingRetention(true);
    try {
      await updateRetentionPolicy(projectId, { retention_days: retentionDays });
      setSavedRetention(true);
      setTimeout(() => setSavedRetention(false), 2000);
    } finally {
      setSavingRetention(false);
    }
  };

  const handleCleanup = async () => {
    if (
      !confirm(
        "This will immediately delete all logs older than your retention period. Continue?"
      )
    )
      return;
    setCleaning(true);
    try {
      await updateRetentionPolicy(projectId, { retention_days: retentionDays });
      const result = await triggerCleanup(projectId);
      const fmt = (d) => (d ? new Date(d).toLocaleString() : "unknown");
      if (result.deletedCount > 0) {
        alert(
          `Cleanup complete — ${
            result.deletedCount
          } logs deleted.\nCutoff: ${fmt(result.cutoff)}`
        );
      } else if (
        result.oldestLog &&
        result.cutoff &&
        new Date(result.oldestLog) >= new Date(result.cutoff)
      ) {
        alert(
          `Nothing to delete — all ${
            result.totalLogs ?? ""
          } logs are newer than the retention period.\n\n` +
            `Your oldest log: ${fmt(result.oldestLog)}\n` +
            `Retention cutoff: ${fmt(result.cutoff)}\n\n` +
            `Logs must be older than ${result.retentionDays} day(s) to be deleted.`
        );
      } else {
        alert(
          `Cleanup ran — 0 logs deleted.\nCutoff used: ${fmt(
            result.cutoff
          )}\nOldest log: ${fmt(result.oldestLog)}`
        );
      }
      getStorageStats(projectId).then(setStorageStats);
    } finally {
      setCleaning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project and all its logs permanently?")) return;
    await deleteProject(projectId);
    navigate("/dashboard");
  };

  if (!project)
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#f4f6f9",
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          color: "#94a3b8",
          fontSize: 13,
        }}
      >
        <Spinner size={44} color1="#e2e8f0" color2="#289E49" />
        Loading settings…
      </div>
    );

  const formatNumber = (n) => parseInt(n || 0).toLocaleString();

  const curlExample = `curl -X POST ${
    import.meta.env.VITE_API_URL
  }/api/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${project.api_key}" \\
  -d '{"logs":[{"level":"info","message":"Hello","service":"api"}]}'`;

  return (
    <>
      <style>{CSS}</style>


      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13,
            fontWeight: 500,
            color: "#64748b",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "5px 8px",
            borderRadius: 6,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#0f172a";
            e.currentTarget.style.background = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.background = "none";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Logs
        </button>
        <span style={{ color: "#cbd5e1", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
          {project.name}
        </span>
        <span style={{ color: "#cbd5e1", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>
          Settings
        </span>
      </div>


      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 24px",
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          {project.name}
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
          Project settings
        </p>


        {storageStats?.storage_warning && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#b45309",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            This project has {formatNumber(storageStats.total_logs)} logs —
            approaching your storage warning threshold. Consider shortening your
            retention period.
          </div>
        )}


        <Card>
          <CardHeader>API key</CardHeader>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <code
              style={{
                flex: 1,
                background: "#0f172a",
                color: "#34d399",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 12,
                overflowX: "auto",
                whiteSpace: "nowrap",
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
              }}
            >
              {project.api_key}
            </code>
            <button
              onClick={handleCopy}
              style={{
                padding: "0 16px",
                background: copied ? "#059669" : "#0d9488",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleRotate}
            disabled={rotating}
            style={{
              fontSize: 12,
              color: "#be123c",
              fontWeight: 500,
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: 6,
              padding: "5px 12px",
              cursor: rotating ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {rotating ? "Rotating…" : "Rotate key"}
          </button>
        </Card>


        <Card>
          <CardHeader>Send your first log</CardHeader>
          <pre
            style={{
              background: "#0f172a",
              color: "#cbd5e1",
              padding: "14px 16px",
              borderRadius: 9,
              fontSize: 11.5,
              overflowX: "auto",
              margin: 0,
              lineHeight: 1.65,
              fontFamily: "ui-monospace, 'Cascadia Code', monospace",
            }}
          >
            {curlExample}
          </pre>
        </Card>


        {storageStats && (
          <Card>
            <CardHeader>Storage</CardHeader>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <StatItem
                label="Total logs"
                value={formatNumber(storageStats.total_logs)}
              />
              <StatItem
                label="Estimated size"
                value={storageStats.estimated_size || "—"}
              />
              <StatItem
                label="Oldest log"
                value={
                  storageStats.oldest_log
                    ? new Date(storageStats.oldest_log).toLocaleDateString()
                    : "—"
                }
              />
              <StatItem
                label="Newest log"
                value={
                  storageStats.newest_log
                    ? new Date(storageStats.newest_log).toLocaleDateString()
                    : "—"
                }
              />
            </div>

            {parseInt(storageStats.total_logs) > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}
                >
                  Level breakdown
                </div>
                {/* Bar */}
                <div
                  style={{
                    display: "flex",
                    height: 8,
                    borderRadius: 99,
                    overflow: "hidden",
                    gap: 1,
                  }}
                >
                  {[
                    { level: "debug", count: storageStats.debug_count },
                    { level: "info", count: storageStats.info_count },
                    { level: "warn", count: storageStats.warn_count },
                    { level: "error", count: storageStats.error_count },
                    { level: "fatal", count: storageStats.fatal_count },
                  ]
                    .filter((l) => parseInt(l.count) > 0)
                    .map((l) => (
                      <div
                        key={l.level}
                        title={`${l.level}: ${formatNumber(l.count)}`}
                        style={{
                          flex: parseInt(l.count),
                          background: LEVEL_COLORS_BAR[l.level],
                          minWidth: 4,
                        }}
                      />
                    ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { level: "debug", count: storageStats.debug_count },
                    { level: "info", count: storageStats.info_count },
                    { level: "warn", count: storageStats.warn_count },
                    { level: "error", count: storageStats.error_count },
                    { level: "fatal", count: storageStats.fatal_count },
                  ]
                    .filter((l) => parseInt(l.count) > 0)
                    .map((l) => (
                      <span
                        key={l.level}
                        style={{
                          fontSize: 11,
                          color: LEVEL_COLORS_TEXT[l.level],
                        }}
                      >
                        {l.level} {formatNumber(l.count)}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {storageStats.last_cleanup && (
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Last cleanup:{" "}
                {new Date(storageStats.last_cleanup.run_at).toLocaleString()} —{" "}
                {formatNumber(storageStats.last_cleanup.deleted_count)} logs
                deleted
              </div>
            )}
          </Card>
        )}


        <Card>
          <CardHeader>Retention policy</CardHeader>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
            Logs older than this are automatically deleted every night at 2am.
          </p>
          <select
            value={retentionDays === null ? "null" : retentionDays}
            onChange={(e) =>
              setRetentionDays(
                e.target.value === "null" ? null : parseInt(e.target.value)
              )
            }
            className="ps-select"
            style={{ marginBottom: 12 }}
          >
            {RETENTION_OPTIONS.map((o) => (
              <option
                key={String(o.value)}
                value={o.value === null ? "null" : o.value}
              >
                {o.label}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleSaveRetention}
              disabled={savingRetention}
              style={{
                padding: "7px 18px",
                background: savingRetention ? "#99f6e4" : "#0d9488",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: savingRetention ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {savingRetention ? "Saving…" : "Save"}
            </button>
            {savedRetention && (
              <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                ✓ Saved
              </span>
            )}
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              style={{
                padding: "7px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                color: "#64748b",
                cursor: cleaning ? "not-allowed" : "pointer",
                marginLeft: "auto",
                fontFamily: "inherit",
              }}
            >
              {cleaning ? "Cleaning…" : "Run cleanup now"}
            </button>
          </div>
        </Card>


        <Card danger>
          <CardHeader danger>Danger zone</CardHeader>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            Permanently delete this project and all of its logs. This action
            cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "#be123c",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#9f1239")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#be123c")}
          >
            Delete project
          </button>
        </Card>
      </div>
    </>
  );
};

export default ProjectSettings;
