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

const RULE_TYPES = [
  { value: "error_rate", label: "Error rate spike" },
  { value: "level_threshold", label: "Specific level threshold" },
  { value: "keyword_match", label: "Keyword match" },
];

const ProjectAlerts = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [rules, setRules] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [activeTab, setActiveTab] = useState("rules");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rule_type: "error_rate",
    threshold_count: 10,
    window_minutes: 5,
    keyword: "",
    service: "",
    slack_webhook_url: "",
  });

  const loadData = () => {
    getAlertRules(projectId).then(setRules).catch(console.error);
    getAlertTriggers(projectId).then(setTriggers).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await createAlertRule(projectId, form);
      setCreating(false);
      setForm({
        name: "",
        rule_type: "error_rate",
        threshold_count: 10,
        window_minutes: 5,
        keyword: "",
        service: "",
        slack_webhook_url: "",
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
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
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const describeRule = (rule) => {
    if (rule.rule_type === "keyword_match") {
      return `"${rule.keyword}" appears ${rule.threshold_count}+ times in ${rule.window_minutes}m`;
    }
    if (rule.rule_type === "level_threshold") {
      return `${rule.level} level ${rule.threshold_count}+ times in ${rule.window_minutes}m`;
    }
    return `Error/fatal logs ${rule.threshold_count}+ times in ${rule.window_minutes}m`;
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px" }}>
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        style={{
          background: "none",
          border: "none",
          color: "#718096",
          cursor: "pointer",
          fontSize: "13px",
          padding: 0,
          marginBottom: "20px",
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
        Alerts
      </h1>
      <p style={{ fontSize: "13px", color: "#718096", margin: "0 0 24px" }}>
        Get notified when your logs show signs of trouble
      </p>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {["rules", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 16px",
              fontSize: "13px",
              fontWeight: "500",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "2px solid #2d3748"
                  : "2px solid transparent",
              background: "none",
              color: activeTab === tab ? "#1a202c" : "#a0aec0",
              cursor: "pointer",
            }}
          >
            {tab === "rules" ? "Rules" : "Trigger history"}
          </button>
        ))}
      </div>

      {activeTab === "rules" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "14px",
            }}
          >
            <button
              onClick={() => setCreating((c) => !c)}
              style={{
                padding: "7px 16px",
                background: "#2d3748",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {creating ? "Cancel" : "New alert rule"}
            </button>
          </div>

          {creating && (
            <div
              style={{
                background: "#F7FAFC",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
              }}
            >
              <input
                type="text"
                placeholder="Rule name (e.g. High error rate in billing)"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "7px",
                  fontSize: "13px",
                  marginBottom: "10px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <select
                value={form.rule_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rule_type: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "7px",
                  fontSize: "13px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {RULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {form.rule_type === "keyword_match" && (
                <input
                  type="text"
                  placeholder="Keyword to match (e.g. timeout)"
                  value={form.keyword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keyword: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "7px",
                    fontSize: "13px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              )}

              {form.rule_type === "level_threshold" && (
                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, level: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "7px",
                    fontSize: "13px",
                    marginBottom: "10px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">Select level</option>
                  {["debug", "info", "warn", "error", "fatal"].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              )}

              <div
                style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "#718096",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Threshold count
                  </label>
                  <input
                    type="number"
                    value={form.threshold_count}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        threshold_count: parseInt(e.target.value) || 0,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "7px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "#718096",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Window (minutes)
                  </label>
                  <input
                    type="number"
                    value={form.window_minutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        window_minutes: parseInt(e.target.value) || 1,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "7px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Service (optional, scope to one service)"
                value={form.service}
                onChange={(e) =>
                  setForm((f) => ({ ...f, service: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "7px",
                  fontSize: "13px",
                  marginBottom: "10px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <input
                type="text"
                placeholder="Slack webhook URL (optional)"
                value={form.slack_webhook_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slack_webhook_url: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "7px",
                  fontSize: "13px",
                  marginBottom: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <button
                onClick={handleCreate}
                style={{
                  padding: "8px 20px",
                  background: "#2d3748",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Create rule
              </button>
            </div>
          )}

          {rules.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px",
                border: "1px dashed #e2e8f0",
                borderRadius: "12px",
                color: "#a0aec0",
                fontSize: "13px",
              }}
            >
              No alert rules yet.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#1a202c",
                    }}
                  >
                    {rule.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#a0aec0",
                      marginTop: "2px",
                    }}
                  >
                    {describeRule(rule)}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <button
                    onClick={() => handleToggle(rule)}
                    style={{
                      width: "34px",
                      height: "19px",
                      borderRadius: "99px",
                      border: "none",
                      background: rule.enabled ? "#2d3748" : "#e2e8f0",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: "2.5px",
                        left: rule.enabled ? "17px" : "2.5px",
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    style={{
                      fontSize: "12px",
                      color: "#9B2335",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
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
            <div
              style={{
                textAlign: "center",
                padding: "50px",
                border: "1px dashed #e2e8f0",
                borderRadius: "12px",
                color: "#a0aec0",
                fontSize: "13px",
              }}
            >
              No alerts have triggered yet.
            </div>
          ) : (
            triggers.map((trigger) => (
              <div
                key={trigger.id}
                style={{
                  background: trigger.acknowledged ? "#fff" : "#FFF5F5",
                  border: `1px solid ${
                    trigger.acknowledged ? "#e2e8f0" : "#FEB2B2"
                  }`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#1a202c",
                      }}
                    >
                      {trigger.rule_name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#718096",
                        marginTop: "2px",
                      }}
                    >
                      {trigger.matched_count} matches ·{" "}
                      {formatTime(trigger.triggered_at)}
                    </div>
                  </div>
                  {!trigger.acknowledged && (
                    <button
                      onClick={() => handleAck(trigger.id)}
                      style={{
                        fontSize: "11px",
                        color: "#3182CE",
                        background: "none",
                        border: "1px solid #BEE3F8",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        cursor: "pointer",
                        flexShrink: 0,
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
    </div>
  );
};

export default ProjectAlerts;
