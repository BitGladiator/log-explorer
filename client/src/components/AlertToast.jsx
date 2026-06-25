import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, getAlertTriggers, getStoredToken } from "../api/client.js";


const AlertToastContext = createContext(null);
export const useAlertToast = () => useContext(AlertToastContext);

const POLL_INTERVAL_MS = 30_000;

export const AlertToastProvider = ({ children }) => {
  
  const [toasts, setToasts] = useState([]);
 
  const shownIds = useRef(new Set());

  const fetchAndQueue = useCallback(async () => {
    if (!getStoredToken()) return; 
    try {
      const projects = await getProjects();
      const results = await Promise.allSettled(
        projects.map((p) =>
          getAlertTriggers(p.id, { unacknowledged: true }).then((triggers) =>
            triggers
              .filter((t) => !t.acknowledged)
              .map((t) => ({ ...t, projectId: p.id, projectName: p.name }))
          )
        )
      );

      const newToasts = [];
      results.forEach((r) => {
        if (r.status !== "fulfilled") return;
        r.value.forEach((trigger) => {
          if (!shownIds.current.has(trigger.id)) {
            shownIds.current.add(trigger.id);
            newToasts.push({
              id: trigger.id,
              ruleName: trigger.rule_name,
              projectId: trigger.projectId,
              projectName: trigger.projectName,
              matchedCount: trigger.matched_count,
              triggeredAt: trigger.triggered_at,
            });
          }
        });
      });

      if (newToasts.length > 0) {
        setToasts((prev) => [...prev, ...newToasts]);
      }
    } catch (_) {
    
    }
  }, []);


  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    fetchAndQueue();
    const timer = setInterval(fetchAndQueue, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchAndQueue]);

  return (
    <AlertToastContext.Provider value={{ toasts, dismiss }}>
      {children}
      <AlertToastStack />
    </AlertToastContext.Provider>
  );
};


const AlertToastStack = () => {
  const { toasts, dismiss } = useAlertToast();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);


  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const handleViewDetails = () => {
    navigate(`/projects/${toast.projectId}/alerts`);
    handleDismiss();
  };

  const formatTime = (ts) => {
    const diffMin = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  return (
    <div
      style={{
        pointerEvents: "all",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: "linear-gradient(135deg, #1a0a0a 0%, #2d0e0e 100%)",
        border: "1px solid rgba(239,68,68,0.45)",
        borderLeft: "4px solid #ef4444",
        borderRadius: "12px",
        padding: "14px 16px",
        minWidth: "320px",
        maxWidth: "400px",
        boxShadow:
          "0 8px 32px rgba(239,68,68,0.25), 0 2px 8px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
      }}
    >
      
      {/* <div
        style={{
          flexShrink: 0,
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "rgba(239,68,68,0.2)",
          border: "1px solid rgba(239,68,68,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}
      >
        🔔
      </div> */}

     
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#ef4444",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "3px",
          }}
        >
          Alert triggered
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={toast.ruleName}
        >
          {toast.ruleName}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "10px",
          }}
        >
          {toast.projectName} · {toast.matchedCount} matches · {formatTime(toast.triggeredAt)}
        </div>

     
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={handleViewDetails}
            style={{
              padding: "5px 12px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.target.style.background = "#ef4444")}
          >
            View Details
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.08)")}
          >
            Dismiss
          </button>
        </div>
      </div>

     
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          fontSize: "16px",
          lineHeight: 1,
          cursor: "pointer",
          padding: "0 0 0 4px",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.target.style.color = "rgba(255,255,255,0.8)")}
        onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.35)")}
        aria-label="Close alert"
      >
        ×
      </button>
    </div>
  );
};
