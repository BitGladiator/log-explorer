import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertTriggers,
  acknowledgeAlert,
} from "../api/client.js";
import { getAnomalies, acknowledgeAnomaly } from "../api/client.js";
import AnomalyCard from "../components/AnomalyCard.jsx";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #f4f6f9;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
  }
  .al-input {
    width: 100%; padding: 8px 12px;
    border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13px; font-family: inherit;
    background: #fff; color: #1e293b; outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .al-input::placeholder { color: #94a3b8; }
  .al-input:focus { border-color: #14b8a6; background: #f0fdfa; }
  .al-select {
    width: 100%; padding: 8px 12px;
    border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13px; font-family: inherit;
    background: #fff; color: #1e293b;
    cursor: pointer; outline: none;
    transition: border-color 0.15s;
  }
  .al-select:focus { border-color: #14b8a6; }
`;

const RULE_TYPES = [
  { value: "error_rate",       label: "Error rate spike"        },
  { value: "level_threshold",  label: "Specific level threshold" },
  { value: "keyword_match",    label: "Keyword match"            },
];


const Section = ({ children }) => (
  <div style={{
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "20px",
    marginBottom: 16,
  }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 14,
  }}>
    {children}
  </div>
);

const ProjectAlerts = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [rules,     setRules]     = useState([]);
  const [triggers,  setTriggers]  = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [activeTab, setActiveTab] = useState("rules");
  const [creating,  setCreating]  = useState(false);
  const [form, setForm] = useState({
    name: "", rule_type: "error_rate",
    threshold_count: 10, window_minutes: 5,
    keyword: "", service: "", slack_webhook_url: "",
  });

  const loadData = () => {
    getAlertRules(projectId).then(setRules).catch(console.error);
    getAlertTriggers(projectId).then(setTriggers).catch(console.error);
    getAnomalies(projectId).then(setAnomalies).catch(console.error);
  };

  useEffect(() => { loadData(); }, [projectId]);

  const handleAckAnomaly = async (id) => {
    await acknowledgeAnomaly(projectId, id);
    loadData();
  };

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await createAlertRule(projectId, form);
      setCreating(false);
      setForm({ name: "", rule_type: "error_rate", threshold_count: 10, window_minutes: 5, keyword: "", service: "", slack_webhook_url: "" });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (rule) => {
    await updateAlertRule(projectId, rule.id, { enabled: !rule.enabled });
    loadData();
  };

  const handleDelete = async (ruleId) => {
    if (!confirm("Delete this alert rule?")) return;
    await deleteAlertRule(projectId, ruleId);
    loadData();
  };

  const handleAck = async (triggerId) => {
    await acknowledgeAlert(projectId, triggerId);
    loadData();
  };

  const formatTime = (ts) => {
    const diffMin = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMin < 1)  return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const describeRule = (rule) => {
    if (rule.rule_type === "keyword_match")
      return `"${rule.keyword}" appears ${rule.threshold_count}+ times in ${rule.window_minutes}m`;
    if (rule.rule_type === "level_threshold")
      return `${rule.level} level ${rule.threshold_count}+ times in ${rule.window_minutes}m`;
    return `Error/fatal logs ${rule.threshold_count}+ times in ${rule.window_minutes}m`;
  };

  const TABS = ["rules", "history", "anomalies"];
  const TAB_LABELS = { rules: "Rules", history: "History", anomalies: "Anomalies" };

  return (
    <>
      <style>{CSS}</style>


      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        height: 52, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 12, position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #14b8a6, #0d9488)",
          borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 13, fontWeight: 500, color: "#64748b",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", padding: "5px 8px", borderRadius: 6,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.background = "#f1f5f9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "none"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Logs
        </button>
        <span style={{ color: "#cbd5e1", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Alerts</span>
      </div>


      <div style={{
        maxWidth: 720, margin: "0 auto", padding: "32px 24px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Alert rules
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
          Get notified when your logs show signs of trouble
        </p>


        <div style={{
          display: "flex", gap: 2,
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 24,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "9px 16px", fontSize: 13, fontWeight: 500,
                border: "none", background: "none", cursor: "pointer",
                fontFamily: "inherit",
                color: activeTab === tab ? "#0d9488" : "#94a3b8",
                borderBottom: `2px solid ${activeTab === tab ? "#14b8a6" : "transparent"}`,
                marginBottom: -1,
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>


        {activeTab === "rules" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button
                onClick={() => setCreating((c) => !c)}
                style={{
                  padding: "7px 16px",
                  background: creating ? "#f8fafc" : "#0d9488",
                  color: creating ? "#64748b" : "#fff",
                  border: creating ? "1px solid #e2e8f0" : "none",
                  borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
              >
                {creating ? "Cancel" : "+ New alert rule"}
              </button>
            </div>


            {creating && (
              <Section>
                <SectionLabel>New alert rule</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Rule name (e.g. High error rate in billing)"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="al-input"
                  />
                  <select
                    value={form.rule_type}
                    onChange={(e) => setForm((f) => ({ ...f, rule_type: e.target.value }))}
                    className="al-select"
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  {form.rule_type === "keyword_match" && (
                    <input
                      type="text"
                      placeholder="Keyword to match (e.g. timeout)"
                      value={form.keyword}
                      onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                      className="al-input"
                    />
                  )}
                  {form.rule_type === "level_threshold" && (
                    <select
                      value={form.level}
                      onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                      className="al-select"
                    >
                      <option value="">Select level</option>
                      {["debug", "info", "warn", "error", "fatal"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 4 }}>
                        Threshold count
                      </label>
                      <input
                        type="number"
                        value={form.threshold_count}
                        onChange={(e) => setForm((f) => ({ ...f, threshold_count: parseInt(e.target.value) || 0 }))}
                        className="al-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 4 }}>
                        Window (minutes)
                      </label>
                      <input
                        type="number"
                        value={form.window_minutes}
                        onChange={(e) => setForm((f) => ({ ...f, window_minutes: parseInt(e.target.value) || 1 }))}
                        className="al-input"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Service (optional — scope to one service)"
                    value={form.service}
                    onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                    className="al-input"
                  />
                  <input
                    type="text"
                    placeholder="Slack webhook URL (optional)"
                    value={form.slack_webhook_url}
                    onChange={(e) => setForm((f) => ({ ...f, slack_webhook_url: e.target.value }))}
                    className="al-input"
                  />

                  <div>
                    <button
                      onClick={handleCreate}
                      style={{
                        padding: "8px 20px",
                        background: "#0d9488", color: "#fff",
                        border: "none", borderRadius: 8,
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Create rule
                    </button>
                  </div>
                </div>
              </Section>
            )}


            {rules.length === 0 ? (
              <EmptyState text="No alert rules yet. Create one above to get notified automatically." />
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    background: "#fff", border: "1px solid #e2e8f0",
                    borderRadius: 10, padding: "14px 16px", marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{rule.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{describeRule(rule)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                    <button
                      onClick={() => handleToggle(rule)}
                      style={{
                        width: 34, height: 19, borderRadius: 99, border: "none",
                        background: rule.enabled ? "#14b8a6" : "#e2e8f0",
                        cursor: "pointer", position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: "#fff",
                        position: "absolute", top: 2.5,
                        left: rule.enabled ? 17 : 2.5,
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      style={{
                        fontSize: 12, color: "#be123c", fontWeight: 500,
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "inherit", padding: "2px 4px",
                        transition: "opacity 0.15s",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}


        {activeTab === "history" && (
          <div>
            {triggers.length === 0 ? (
              <EmptyState text="No alerts have triggered yet." />
            ) : (
              triggers.map((trigger) => (
                <div
                  key={trigger.id}
                  style={{
                    background: trigger.acknowledged ? "#fff" : "#fff1f2",
                    border: `1px solid ${trigger.acknowledged ? "#e2e8f0" : "#fecdd3"}`,
                    borderRadius: 10, padding: "14px 16px", marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                        {trigger.rule_name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        {trigger.matched_count} matches · {formatTime(trigger.triggered_at)}
                      </div>
                    </div>
                    {!trigger.acknowledged && (
                      <button
                        onClick={() => handleAck(trigger.id)}
                        style={{
                          fontSize: 11, color: "#0d9488", fontWeight: 600,
                          background: "#f0fdfa", border: "1px solid #99f6e4",
                          borderRadius: 6, padding: "4px 10px",
                          cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                        }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}


        {activeTab === "anomalies" && (
          <div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
              Detected automatically by comparing current activity against your project's learned baseline
            </p>
            {anomalies.length === 0 ? (
              <EmptyState text="No anomalies detected. The baseline needs about 30 minutes of activity before detection becomes meaningful." />
            ) : (
              anomalies.map((a) => (
                <AnomalyCard key={a.id} anomaly={a} onAck={handleAckAnomaly} />
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};

const EmptyState = ({ text }) => (
  <div style={{
    textAlign: "center", padding: "48px 24px",
    border: "1px dashed #e2e8f0", borderRadius: 12,
    background: "#fff", color: "#94a3b8", fontSize: 13, lineHeight: 1.6,
  }}>
    {text}
  </div>
);

export default ProjectAlerts;
