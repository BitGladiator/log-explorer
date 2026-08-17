import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLogs,
  getProjects,
  naturalQuery,
  getClusters,
  analyzeCluster,
} from "../api/client.js";
import useLogStream from "../hooks/useLogStream.js";
import LogRow from "../components/LogRow.jsx";
import LogDetail from "../components/LogDetail.jsx";
import NaturalQueryBar from "../components/NaturalQueryBar.jsx";
import ClusterCard from "../components/ClusterCard.jsx";
import LogsInsightStrip from "../components/LogsInsightStrip.jsx";
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

  .pl-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #f4f6f9;
  }

  /* ── Nav ── */
  .pl-nav {
    height: 52px;
    flex-shrink: 0;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    z-index: 50;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .pl-nav-back {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 5px 8px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }
  .pl-nav-back:hover { color: #0f172a; background: #f1f5f9; }
  .pl-nav-sep { color: #cbd5e1; font-size: 16px; }
  .pl-nav-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.2px;
  }
  .pl-nav-right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .pl-nav-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 5px 12px;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .pl-nav-btn:hover { color: #0f172a; border-color: #cbd5e1; background: #f1f5f9; }
  .pl-live-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 7px;
    border: 1px solid;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .pl-live-btn.live  { color: #059669; background: #ecfdf5; border-color: #6ee7b7; }
  .pl-live-btn.live:hover { background: #d1fae5; }
  .pl-live-btn.paused { color: #64748b; background: #f8fafc; border-color: #e2e8f0; }
  .pl-live-btn.paused:hover { color: #334155; border-color: #cbd5e1; }
  .pl-live-dot { width: 6px; height: 6px; border-radius: 50%; }

  /* ── Tabs ── */
  .pl-tabs {
    display: flex;
    gap: 2px;
    padding: 0 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
    flex-shrink: 0;
  }
  .pl-tab {
    font-size: 13px;
    font-weight: 500;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    border-bottom: 2px solid transparent;
    color: #94a3b8;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }
  .pl-tab.active { color: #0d9488; border-bottom-color: #14b8a6; }
  .pl-tab:hover:not(.active) { color: #475569; }

  /* ── Insight panel wrapper ── */
  .pl-insight-panel {
    flex-shrink: 0;
    background: #fff;
    position: relative;
  }

  /* Collapse toggle sitting inside the insight strip area */
  .pl-section-toggle {
    position: absolute;
    top: 8px;
    right: 14px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 3px 8px;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    user-select: none;
    -webkit-user-select: none;
  }
  .pl-section-toggle:hover { color: #0d9488; border-color: #99f6e4; background: #f0fdfa; }
  .pl-section-toggle svg {
    transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
    flex-shrink: 0;
  }
  .pl-section-toggle.collapsed svg { transform: rotate(180deg); }

  /* Animated body for insight */
  .pl-insight-body {
    overflow: hidden;
    transition: height 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  /* ── Resize handle (row-resize, at bottom of a panel) ── */
  .pl-resize-handle {
    height: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: row-resize;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    user-select: none;
    -webkit-user-select: none;
    transition: background 0.12s;
  }
  .pl-resize-handle:hover,
  .pl-resize-handle.dragging { background: #f0fdfa; }
  .pl-resize-handle-bar {
    width: 32px;
    height: 3px;
    background: #e2e8f0;
    border-radius: 99px;
    transition: background 0.15s, width 0.15s;
  }
  .pl-resize-handle:hover .pl-resize-handle-bar,
  .pl-resize-handle.dragging .pl-resize-handle-bar {
    background: #14b8a6;
    width: 48px;
  }

  /* ── NaturalQuery wrapper ── */
  .pl-nqb-outer {
    flex-shrink: 0;
    background: #fff;
    overflow: hidden;
    transition: height 0.28s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }
  .pl-nqb-inner {
    padding: 10px 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  /* ── Filter bar ── */
  .pl-filter-outer {
    flex-shrink: 0;
    background: #fff;
    overflow: hidden;
    transition: height 0.28s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }
  .pl-filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
    flex-wrap: wrap;
    position: relative;
  }
  .pl-search {
    flex: 1;
    min-width: 180px;
    padding: 7px 12px 7px 34px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    color: #1e293b;
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s;
  }
  .pl-search::placeholder { color: #94a3b8; }
  .pl-search:focus { border-color: #14b8a6; background: #f0fdfa; }
  .pl-search-wrap { position: relative; flex: 1; min-width: 180px; }
  .pl-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
  .pl-level-pill {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.05em;
    transition: all 0.15s;
  }
  .pl-service-select {
    padding: 6px 10px;
    border-radius: 7px;
    font-size: 12px;
    font-family: inherit;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }
  .pl-service-select:focus { border-color: #14b8a6; }

  /* ── Log list ── */
  .pl-log-list {
    flex: 1;
    overflow-y: auto;
    background: #ffffff;
    min-height: 0;
  }
  .pl-log-list::-webkit-scrollbar { width: 6px; }
  .pl-log-list::-webkit-scrollbar-track { background: #f8fafc; }
  .pl-log-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .pl-log-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* ── Status bar ── */
  .pl-statusbar {
    height: 30px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
  }
  .pl-statusbar span { display: flex; align-items: center; gap: 4px; }

  /* ── Clusters ── */
  .pl-clusters {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #f4f6f9;
    min-height: 0;
  }
  .pl-clusters::-webkit-scrollbar { width: 6px; }
  .pl-clusters::-webkit-scrollbar-track { background: #f8fafc; }
  .pl-clusters::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .pl-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 8px;
    font-size: 13px;
    color: #94a3b8;
    border: 1px dashed #e2e8f0;
    border-radius: 12px;
    background: #fff;
  }
  .pl-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100px;
    gap: 12px;
    font-size: 13px;
    color: #94a3b8;
  }
`;

const LEVELS = ["debug", "info", "warn", "error", "fatal"];

const LEVEL_PILL_ACTIVE = {
  debug: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  info: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  warn: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  error: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  fatal: { bg: "#fff1f2", color: "#9f1239", border: "#fda4af" },
};

const INSIGHT_MIN_H = 60;
const INSIGHT_DEFAULT = 200;

const Chevron = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const CollapseToggle = ({ open, onToggle, label }) => (
  <button
    className={`pl-section-toggle${open ? "" : " collapsed"}`}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    title={open ? `Collapse ${label}` : `Expand ${label}`}
  >
    <Chevron />
    {open ? "Collapse" : "Expand"}
  </button>
);

/* ── Collapsible + resizable insight strip ─────────────── */
const InsightPanel = ({ projectId, onTimeRangeChange }) => {
  const [open, setOpen] = useState(true);
  const [panelH, setPanelH] = useState(INSIGHT_DEFAULT);
  const bodyRef = useRef(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  /* sync height to open state */
  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.style.height = open ? `${panelH}px` : "0px";
  }, [open, panelH]);

  const onPointerDown = useCallback(
    (e) => {
      if (!open) return;
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      startH.current = panelH;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("dragging");
    },
    [open, panelH],
  );

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const newH = Math.max(
      INSIGHT_MIN_H,
      startH.current + (e.clientY - startY.current),
    );
    setPanelH(newH);
    if (bodyRef.current) {
      bodyRef.current.style.height = `${newH}px`;
      bodyRef.current.style.transition = "none";
    }
  }, []);

  const onPointerUp = useCallback((e) => {
    dragging.current = false;
    if (bodyRef.current) bodyRef.current.style.transition = "";
    e.currentTarget.classList.remove("dragging");
  }, []);

  return (
    <div className="pl-insight-panel">
      <CollapseToggle
        open={open}
        onToggle={() => setOpen((v) => !v)}
        label="insights"
      />

      <div
        ref={bodyRef}
        className="pl-insight-body"
        style={{ height: open ? `${panelH}px` : "0px", overflowY: "auto" }}
      >
        <LogsInsightStrip
          projectId={projectId}
          onTimeRangeChange={onTimeRangeChange}
        />
      </div>

      {open && (
        <div
          className="pl-resize-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          title="Drag to resize"
        >
          <div className="pl-resize-handle-bar" />
        </div>
      )}
    </div>
  );
};

/* ── Collapsible wrapper for any fixed-height section ───── */
const CollapsiblePanel = ({
  open,
  innerRef,
  children,
  borderBottom = true,
}) => {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!wrapRef.current || !innerRef?.current) return;
    if (open) {
      wrapRef.current.style.height = `${innerRef.current.scrollHeight}px`;
    } else {
      wrapRef.current.style.height = "0px";
    }
  }, [open, innerRef]);

  return (
    <div
      ref={wrapRef}
      style={{
        overflow: "hidden",
        flexShrink: 0,
        transition: "height 0.28s cubic-bezier(0.4,0,0.2,1)",
        borderBottom: open && borderBottom ? "1px solid #e2e8f0" : "none",
      }}
    >
      {children}
    </div>
  );
};

const ProjectLogs = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState("logs");

  const [levelFilter, setLevelFilter] = useState(new Set());
  const [serviceFilter, setServiceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState(null);

  const [clusters, setClusters] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  const [nqbOpen, setNqbOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);

  const nqbInnerRef = useRef(null);
  const filterInnerRef = useRef(null);

  const { streamedLogs, clearStream } = useLogStream(projectId, isLive);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    getProjects()
      .then((ps) =>
        setProject(ps.find((p) => String(p.id) === String(projectId))),
      )
      .catch(console.error);
  }, [projectId]);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = { limit: 200 };
    if (levelFilter.size > 0) params.level = [...levelFilter][0];
    if (serviceFilter) params.service = serviceFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    if (timeRange?.from) params.from = timeRange.from;
    if (timeRange?.to) params.to = timeRange.to;
    getLogs(projectId, params)
      .then((res) => setHistoricalLogs(res.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId, levelFilter, serviceFilter, debouncedSearch, timeRange]);

  const handleTimeRangeChange = useCallback(({ from, to }) => {
    setTimeRange({ from, to });
    setIsLive(false);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const loadClusters = useCallback(() => {
    setClustersLoading(true);
    getClusters(projectId, { sinceHours: 24, limit: 20 })
      .then(setClusters)
      .catch(console.error)
      .finally(() => setClustersLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "clusters") loadClusters();
  }, [activeTab, loadClusters]);

  const handleNaturalQuery = async (query) => {
    setQueryLoading(true);
    try {
      const result = await naturalQuery(projectId, query);
      setHistoricalLogs(result.logs);
      setIsLive(false);
      return result;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setQueryLoading(false);
    }
  };

  const handleAnalyzeCluster = async (clusterId) =>
    analyzeCluster(projectId, clusterId);

  const toggleLevel = (level) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const filteredStream = streamedLogs.filter((log) => {
    if (levelFilter.size > 0 && !levelFilter.has(log.level)) return false;
    if (serviceFilter && log.service !== serviceFilter) return false;
    if (
      debouncedSearch &&
      !log.message.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const allLogs = isLive
    ? [
        ...filteredStream,
        ...historicalLogs.filter(
          (h) => !filteredStream.some((s) => s.id === h.id),
        ),
      ]
    : historicalLogs;

  const services = [
    ...new Set(
      [...historicalLogs, ...streamedLogs]
        .map((l) => l.service)
        .filter(Boolean),
    ),
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="pl-shell">

        <div className="pl-nav">
          <button
            className="pl-nav-back"
            onClick={() => navigate("/dashboard")}
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
            Dashboard
          </button>
          <span className="pl-nav-sep">/</span>
          <span className="pl-nav-title">{project?.name || "Loading…"}</span>

          <div className="pl-nav-right">
            <button
              className={`pl-live-btn ${isLive ? "live" : "paused"}`}
              onClick={() => {
                setIsLive((v) => !v);
                if (!isLive) clearStream();
              }}
            >
              <span
                className="pl-live-dot"
                style={{ background: isLive ? "#059669" : "#cbd5e1" }}
              />
              {isLive ? "Live" : "Paused"}
            </button>

            <button
              className="pl-nav-btn"
              onClick={() => navigate(`/projects/${projectId}/alerts`)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Alerts
            </button>

            <button
              className="pl-nav-btn"
              onClick={() => navigate(`/projects/${projectId}/settings`)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          </div>
        </div>

        {/* ── Tabs — unchanged ── */}
        <div className="pl-tabs">
          {["logs", "clusters"].map((tab) => (
            <button
              key={tab}
              className={`pl-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "logs" ? "Live Logs" : "Error Clusters"}
            </button>
          ))}
        </div>

        {activeTab === "logs" && (
          <>
            {/* ── Insight strip: collapsible + resizable ── */}
            <InsightPanel
              projectId={projectId}
              onTimeRangeChange={handleTimeRangeChange}
            />


            <CollapsiblePanel open={nqbOpen} innerRef={nqbInnerRef}>
              <div
                ref={nqbInnerRef}
                style={{ padding: "10px 20px", position: "relative" }}
              >
                <CollapseToggle
                  open={nqbOpen}
                  onToggle={() => setNqbOpen((v) => !v)}
                  label="AI query"
                />
                <NaturalQueryBar
                  onQuery={handleNaturalQuery}
                  loading={queryLoading}
                />
              </div>
            </CollapsiblePanel>

            {/* ── Filter bar: collapsible ── */}
            <CollapsiblePanel open={filterOpen} innerRef={filterInnerRef}>
              <div ref={filterInnerRef} className="pl-filter-bar">
                <CollapseToggle
                  open={filterOpen}
                  onToggle={() => setFilterOpen((v) => !v)}
                  label="filters"
                />

                <div className="pl-search-wrap">
                  <svg
                    className="pl-search-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Filter by keyword…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-search"
                  />
                </div>

                <div style={{ display: "flex", gap: 5 }}>
                  {LEVELS.map((level) => {
                    const active = levelFilter.has(level);
                    const s = active ? LEVEL_PILL_ACTIVE[level] : null;
                    return (
                      <button
                        key={level}
                        onClick={() => toggleLevel(level)}
                        className="pl-level-pill"
                        style={
                          active
                            ? {
                                background: s.bg,
                                color: s.color,
                                borderColor: s.border,
                              }
                            : {
                                background: "#f8fafc",
                                color: "#94a3b8",
                                borderColor: "#e2e8f0",
                              }
                        }
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>

                {services.length > 0 && (
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="pl-service-select"
                  >
                    <option value="">All services</option>
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CollapsiblePanel>


            <div className="pl-log-list">
              {loading && historicalLogs.length === 0 ? (
                <div className="pl-loading">
                  <Spinner size={36} color1="#e2e8f0" color2="#289E49" />
                  <span>Loading logs…</span>
                </div>
              ) : allLogs.length === 0 ? (
                <div className="pl-empty">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  No logs found
                </div>
              ) : (
                allLogs.map((log, i) => (
                  <LogRow
                    key={log.id || i}
                    log={log}
                    onClick={setSelectedLog}
                  />
                ))
              )}
            </div>


            <div className="pl-statusbar">
              <span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {allLogs.length.toLocaleString()} logs
              </span>
              {isLive && (
                <span style={{ color: "#059669" }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#059669",
                      display: "inline-block",
                      marginRight: 4,
                    }}
                  />
                  streaming live
                </span>
              )}
              {levelFilter.size > 0 && (
                <span style={{ color: "#0d9488" }}>
                  filtered by level
                  <button
                    onClick={() => setLevelFilter(new Set())}
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      color: "#94a3b8",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    clear
                  </button>
                </span>
              )}
            </div>
          </>
        )}

        {activeTab === "clusters" && (
          <div className="pl-clusters">
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
              Similar errors grouped together — last 24 hours
            </p>
            {clustersLoading ? (
              <div className="pl-loading">
                <Spinner size={36} color1="#e2e8f0" color2="#289E49" />
                <span>Grouping errors…</span>
              </div>
            ) : clusters.length === 0 ? (
              <div className="pl-empty">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                No recurring errors in the last 24 hours
              </div>
            ) : (
              clusters.map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  onAnalyze={handleAnalyzeCluster}
                />
              ))
            )}
          </div>
        )}

        <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
      </div>
    </>
  );
};

export default ProjectLogs;
