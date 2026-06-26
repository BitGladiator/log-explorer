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

      const fmt = (d) => d ? new Date(d).toLocaleString() : "unknown";

      if (result.deletedCount > 0) {
        alert(`Cleanup complete — ${result.deletedCount} logs deleted.\nCutoff: ${fmt(result.cutoff)}`);
      } else if (result.oldestLog && result.cutoff && new Date(result.oldestLog) >= new Date(result.cutoff)) {
        alert(
          `Nothing to delete — all ${result.totalLogs ?? ""} logs are newer than the retention period.\n\n` +
          `Your oldest log: ${fmt(result.oldestLog)}\n` +
          `Retention cutoff: ${fmt(result.cutoff)}\n\n` +
          `Logs must be older than ${result.retentionDays} day(s) to be deleted.`
        );
      } else {
        alert(
          `Cleanup ran — 0 logs deleted.\n` +
          `Cutoff used: ${fmt(result.cutoff)}\n` +
          `Oldest log: ${fmt(result.oldestLog)}`
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
    return <div style={{ padding: "40px", color: "#a0aec0" }}>Loading...</div>;

  const curlExample = `curl -X POST ${
    import.meta.env.VITE_API_URL
  }/api/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${project.api_key}" \\
  -d '{"logs":[{"level":"info","message":"Hello","service":"api"}]}'`;

  const formatNumber = (n) => parseInt(n || 0).toLocaleString();

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 24px" }}>
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        style={{
          background: "none",
          border: "none",
          color: "#718096",
          cursor: "pointer",
          fontSize: "13px",
          padding: 0,
          marginBottom: "24px",
        }}
      >
        ← Back to logs
      </button>

      <h1
        style={{
          fontSize: "20px",
          fontWeight: "600",
          color: "#1a202c",
          margin: "0 0 4px",
        }}
      >
        {project.name}
      </h1>
      <p style={{ fontSize: "13px", color: "#718096", margin: "0 0 28px" }}>
        Project settings
      </p>
      {storageStats?.storage_warning && (
        <div
          style={{
            background: "#FEFCBF",
            border: "1px solid #F6E05E",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#744210",
          }}
        >
          This project has {formatNumber(storageStats.total_logs)} logs —
          approaching your storage warning threshold. Consider shortening your
          retention period.
        </div>
      )}
      <div
        style={{
          background: "#F7FAFC",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#718096",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          API key
        </h3>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <code
            style={{
              flex: 1,
              background: "#1a202c",
              color: "#68D391",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {project.api_key}
          </code>
          <button
            onClick={handleCopy}
            style={{
              padding: "0 16px",
              background: copied ? "#276749" : "#2d3748",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          onClick={handleRotate}
          disabled={rotating}
          style={{
            fontSize: "12px",
            color: "#9B2335",
            background: "none",
            border: "1px solid #FEB2B2",
            borderRadius: "6px",
            padding: "5px 12px",
            cursor: rotating ? "not-allowed" : "pointer",
          }}
        >
          {rotating ? "Rotating..." : "Rotate key"}
        </button>
      </div>
      <div
        style={{
          background: "#F7FAFC",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#718096",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          Send your first log
        </h3>
        <pre
          style={{
            background: "#1a202c",
            color: "#cbd5e0",
            padding: "14px",
            borderRadius: "8px",
            fontSize: "11px",
            overflowX: "auto",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {curlExample}
        </pre>
      </div>
      {storageStats && (
        <div
          style={{
            background: "#F7FAFC",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#718096",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              margin: "0 0 16px",
            }}
          >
            Storage
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "16px",
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
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#a0aec0",
                  marginBottom: "6px",
                }}
              >
                Level breakdown
              </div>
              <div
                style={{
                  display: "flex",
                  height: "8px",
                  borderRadius: "99px",
                  overflow: "hidden",
                  gap: "1px",
                }}
              >
                {[
                  {
                    level: "debug",
                    count: storageStats.debug_count,
                    color: "#CBD5E0",
                  },
                  {
                    level: "info",
                    count: storageStats.info_count,
                    color: "#90CDF4",
                  },
                  {
                    level: "warn",
                    count: storageStats.warn_count,
                    color: "#F6E05E",
                  },
                  {
                    level: "error",
                    count: storageStats.error_count,
                    color: "#FEB2B2",
                  },
                  {
                    level: "fatal",
                    count: storageStats.fatal_count,
                    color: "#9B2335",
                  },
                ]
                  .filter((l) => parseInt(l.count) > 0)
                  .map((l) => (
                    <div
                      key={l.level}
                      title={`${l.level}: ${formatNumber(l.count)}`}
                      style={{
                        flex: parseInt(l.count),
                        background: l.color,
                        minWidth: "4px",
                      }}
                    />
                  ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "6px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  {
                    level: "debug",
                    count: storageStats.debug_count,
                    color: "#718096",
                  },
                  {
                    level: "info",
                    count: storageStats.info_count,
                    color: "#2B6CB0",
                  },
                  {
                    level: "warn",
                    count: storageStats.warn_count,
                    color: "#744210",
                  },
                  {
                    level: "error",
                    count: storageStats.error_count,
                    color: "#9B2335",
                  },
                  {
                    level: "fatal",
                    count: storageStats.fatal_count,
                    color: "#9B2335",
                  },
                ]
                  .filter((l) => parseInt(l.count) > 0)
                  .map((l) => (
                    <span
                      key={l.level}
                      style={{ fontSize: "11px", color: l.color }}
                    >
                      {l.level} {formatNumber(l.count)}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {storageStats.last_cleanup && (
            <div style={{ fontSize: "11px", color: "#a0aec0" }}>
              Last cleanup:{" "}
              {new Date(storageStats.last_cleanup.run_at).toLocaleString()} —{" "}
              {formatNumber(storageStats.last_cleanup.deleted_count)} logs
              deleted
            </div>
          )}
        </div>
      )}

      <div
        style={{
          background: "#F7FAFC",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#718096",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          Retention policy
        </h3>
        <p style={{ fontSize: "12px", color: "#718096", margin: "0 0 14px" }}>
          Logs older than this are automatically deleted every night at 2am.
        </p>

        <select
          value={retentionDays === null ? "null" : retentionDays}
          onChange={(e) =>
            setRetentionDays(
              e.target.value === "null" ? null : parseInt(e.target.value)
            )
          }
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: "7px",
            fontSize: "13px",
            marginBottom: "12px",
            cursor: "pointer",
            outline: "none",
          }}
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

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleSaveRetention}
            disabled={savingRetention}
            style={{
              padding: "7px 18px",
              background: "#2d3748",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: savingRetention ? "not-allowed" : "pointer",
              opacity: savingRetention ? 0.7 : 1,
            }}
          >
            {savingRetention ? "Saving..." : "Save"}
          </button>
          {savedRetention && (
            <span style={{ fontSize: "12px", color: "#38A169" }}>Saved</span>
          )}

          <button
            onClick={handleCleanup}
            disabled={cleaning}
            style={{
              padding: "7px 14px",
              background: "none",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#718096",
              cursor: cleaning ? "not-allowed" : "pointer",
              marginLeft: "auto",
            }}
          >
            {cleaning ? "Cleaning..." : "Run cleanup now"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#FFF5F5",
          border: "1px solid #FEB2B2",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#9B2335",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          Danger zone
        </h3>
        <button
          onClick={handleDelete}
          style={{
            fontSize: "13px",
            color: "#fff",
            background: "#C53030",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Delete project
        </button>
      </div>
    </div>
  );
};

const StatItem = ({ label, value }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
    }}
  >
    <div style={{ fontSize: "11px", color: "#a0aec0", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a202c" }}>
      {value}
    </div>
  </div>
);

export default ProjectSettings;
