import { useEffect, useState, useCallback } from "react";
import { getLogTimeseries } from "../api/client.js";

const TIME_RANGES = [
  { label: "1h", ms: 60 * 60 * 1000, buckets: 12 },
  { label: "6h", ms: 6 * 60 * 60 * 1000, buckets: 24 },
  { label: "24h", ms: 24 * 60 * 60 * 1000, buckets: 24 },
  { label: "7d", ms: 7 * 24 * 60 * 60 * 1000, buckets: 28 },
  { label: "30d", ms: 30 * 24 * 60 * 60 * 1000, buckets: 30 },
];

const LEVEL_COLORS = {
  debug: "#CBD5E0",
  info: "#90CDF4",
  warn: "#F6E05E",
  error: "#FC8181",
  fatal: "#9B2335",
};

const VolumeChart = ({ series, rangeLabel, onBucketClick }) => {
  const [hovered, setHovered] = useState(null);

  if (!series || series.length === 0) {
    return (
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a0aec0",
          fontSize: "12px",
        }}
      >
        No logs in this time range
      </div>
    );
  }

  const max = Math.max(...series.map((s) => parseInt(s.total)), 1);

  const formatBucketLabel = (bucket) => {
    const d = new Date(bucket);
    if (rangeLabel === "1h" || rangeLabel === "6h") {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    if (rangeLabel === "24h") {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          height: "64px",
        }}
      >
        {series.map((s, i) => {
          const total = parseInt(s.total);
          const heightPct = (total / max) * 100;
          const fatalPct =
            total > 0 ? (parseInt(s.fatal) / total) * heightPct : 0;
          const errorPct =
            total > 0 ? (parseInt(s.error) / total) * heightPct : 0;
          const warnPct =
            total > 0 ? (parseInt(s.warn) / total) * heightPct : 0;
          const infoPct =
            total > 0 ? (parseInt(s.info) / total) * heightPct : 0;
          const debugPct = heightPct - fatalPct - errorPct - warnPct - infoPct;

          const isHovered = hovered === i;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                cursor: total > 0 ? "pointer" : "default",
                position: "relative",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => total > 0 && onBucketClick && onBucketClick(s)}
            >
              {isHovered && total > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1a202c",
                    color: "#fff",
                    fontSize: "10px",
                    padding: "5px 8px",
                    borderRadius: "6px",
                    whiteSpace: "nowrap",
                    zIndex: 20,
                    marginBottom: "4px",
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: "600" }}>
                    {formatBucketLabel(s.bucket)}
                  </div>
                  <div>{total} logs</div>
                  {parseInt(s.error) + parseInt(s.fatal) > 0 && (
                    <div style={{ color: "#FC8181" }}>
                      {parseInt(s.error) + parseInt(s.fatal)} errors
                    </div>
                  )}
                  {parseInt(s.warn) > 0 && (
                    <div style={{ color: "#F6E05E" }}>{s.warn} warnings</div>
                  )}
                </div>
              )}
              {/* The wrapper must have an explicit height so child %-heights resolve correctly */}
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  opacity: isHovered ? 1 : 0.85,
                  transition: "opacity 0.1s",
                }}
              >
                {fatalPct > 0 && (
                  <div
                    style={{
                      flex: `${fatalPct}`,
                      background: LEVEL_COLORS.fatal,
                      borderRadius: "2px 2px 0 0",
                      minHeight: "2px",
                    }}
                  />
                )}
                {errorPct > 0 && (
                  <div
                    style={{
                      flex: `${errorPct}`,
                      background: LEVEL_COLORS.error,
                      borderRadius: fatalPct === 0 ? "2px 2px 0 0" : 0,
                      minHeight: "2px",
                    }}
                  />
                )}
                {warnPct > 0 && (
                  <div
                    style={{
                      flex: `${warnPct}`,
                      background: LEVEL_COLORS.warn,
                      borderRadius:
                        fatalPct === 0 && errorPct === 0 ? "2px 2px 0 0" : 0,
                      minHeight: "2px",
                    }}
                  />
                )}
                {infoPct > 0 && (
                  <div
                    style={{
                      flex: `${infoPct}`,
                      background: LEVEL_COLORS.info,
                      borderRadius:
                        fatalPct === 0 && errorPct === 0 && warnPct === 0
                          ? "2px 2px 0 0"
                          : 0,
                      minHeight: "2px",
                    }}
                  />
                )}
                {debugPct > 0 && (
                  <div
                    style={{
                      flex: `${debugPct}`,
                      background: LEVEL_COLORS.debug,
                      borderRadius: heightPct === debugPct ? "2px 2px 0 0" : 0,
                      minHeight: "1px",
                    }}
                  />
                )}
                {total === 0 && (
                  <div
                    style={{
                      height: "2px",
                      background: "#f1f5f9",
                      borderRadius: "2px",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "5px",
        }}
      >
        {[
          0,
          Math.floor(series.length / 4),
          Math.floor(series.length / 2),
          Math.floor((series.length * 3) / 4),
          series.length - 1,
        ]
          .filter((i, pos, arr) => arr.indexOf(i) === pos)
          .map((i) => (
            <span key={i} style={{ fontSize: "10px", color: "#a0aec0" }}>
              {series[i] ? formatBucketLabel(series[i].bucket) : ""}
            </span>
          ))}
      </div>
    </div>
  );
};

const ErrorRateLine = ({ series }) => {
  if (!series || series.length < 2) return null;

  const rates = series.map((s) => {
    const total = parseInt(s.total);
    if (total === 0) return 0;
    return ((parseInt(s.error) + parseInt(s.fatal)) / total) * 100;
  });

  const max = Math.max(...rates, 1);
  const W = 120;
  const H = 28;

  const points = rates
    .map((r, i) => {
      const x = (i / (rates.length - 1)) * W;
      const y = H - (r / max) * H;
      return `${x},${y}`;
    })
    .join(" ");

  const hasErrors = rates.some((r) => r > 0);
  if (!hasErrors)
    return (
      <div style={{ fontSize: "11px", color: "#38A169" }}>0% error rate</div>
    );

  const avgRate = rates.reduce((s, r) => s + r, 0) / rates.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="err-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FC8181" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FC8181" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${points} ${W},${H}`} fill="url(#err-grad)" />
        <polyline
          points={points}
          fill="none"
          stroke="#FC8181"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ fontSize: "11px", color: "#9B2335" }}>
        {avgRate.toFixed(1)}% avg error rate
      </div>
    </div>
  );
};

const LogsInsightStrip = ({ projectId, onTimeRangeChange }) => {
  const [activeRange, setActiveRange] = useState("24h");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // isUserAction = true means the user explicitly clicked a range/bar;
  // false means the initial auto-fetch on mount — we should NOT pause live mode in that case.
  const fetchTimeseries = useCallback(
    (rangeLabel, from, to, isUserAction = false) => {
      setLoading(true);

      const range = TIME_RANGES.find((r) => r.label === rangeLabel);
      const toDate = to ? new Date(to) : new Date();
      const fromDate = from
        ? new Date(from)
        : new Date(toDate - (range?.ms || 24 * 60 * 60 * 1000));
      const buckets = range?.buckets || 24;

      getLogTimeseries(projectId, {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        buckets,
      })
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));

      // Only pause live mode when the user explicitly changes the time range.
      // The automatic mount-time fetch should never affect the live/paused state.
      if (isUserAction) {
        onTimeRangeChange?.({
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        });
      }
    },
    [projectId, onTimeRangeChange]
  );

  useEffect(() => {
    // Initial load — not a user action, so don't notify parent (don't pause live mode)
    fetchTimeseries(activeRange, undefined, undefined, false);
  }, [activeRange, fetchTimeseries]);

  const handleRangeClick = (label) => {
    // User explicitly clicked a range button — this IS a user action, so pause live mode
    setActiveRange(label);
    setShowCustom(false);
    fetchTimeseries(label, undefined, undefined, true);
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    fetchTimeseries("custom", customFrom, customTo, true);
    setShowCustom(false);
  };

  const handleBucketClick = (bucket) => {
    const bucketTime = new Date(bucket.bucket);
    const range = TIME_RANGES.find((r) => r.label === activeRange);
    const bucketDuration = range ? range.ms / range.buckets : 60 * 60 * 1000;
    const from = new Date(bucketTime).toISOString();
    const to = new Date(bucketTime.getTime() + bucketDuration).toISOString();

    // Re-fetch the chart for the zoomed window with finer granularity
    setLoading(true);
    getLogTimeseries(projectId, { from, to, buckets: 12 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Also notify the parent to filter the log list to this window
    onTimeRangeChange?.({ from, to });
  };

  const summary = data?.summary;
  const fmt = (n) => parseInt(n || 0).toLocaleString();
  const errorCount =
    parseInt(summary?.errors || 0) + parseInt(summary?.fatals || 0);
  const errorRate =
    parseInt(summary?.total) > 0
      ? ((errorCount / parseInt(summary.total)) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "14px 20px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "12px",
        }}
      >
        <span
          style={{ fontSize: "11px", color: "#a0aec0", marginRight: "4px" }}
        >
          Range
        </span>
        {TIME_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => handleRangeClick(r.label)}
            style={{
              fontSize: "11px",
              fontWeight: "500",
              padding: "3px 10px",
              borderRadius: "6px",
              border: "1px solid",
              cursor: "pointer",
              borderColor: activeRange === r.label ? "#2d3748" : "#e2e8f0",
              background: activeRange === r.label ? "#2d3748" : "#fff",
              color: activeRange === r.label ? "#fff" : "#718096",
            }}
          >
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          style={{
            fontSize: "11px",
            fontWeight: "500",
            padding: "3px 10px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            background: showCustom ? "#F7FAFC" : "#fff",
            color: "#718096",
            cursor: "pointer",
          }}
        >
          Custom
        </button>

        {showCustom && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "4px",
            }}
          >
            <input
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "11px", color: "#a0aec0" }}>to</span>
            <input
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                outline: "none",
              }}
            />
            <button
              onClick={handleCustomApply}
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                background: "#2d3748",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#a0aec0",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "2px",
            }}
          >
            Total
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1a202c",
              lineHeight: 1,
            }}
          >
            {loading ? "—" : fmt(summary?.total)}
          </div>
          <div style={{ fontSize: "10px", color: "#a0aec0", marginTop: "2px" }}>
            logs
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#a0aec0",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "2px",
            }}
          >
            Errors
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: errorCount > 0 ? "#9B2335" : "#1a202c",
              lineHeight: 1,
            }}
          >
            {loading ? "—" : fmt(errorCount)}
          </div>
          <div style={{ fontSize: "10px", color: "#a0aec0", marginTop: "2px" }}>
            {errorRate}% of traffic
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#a0aec0",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "2px",
            }}
          >
            Warnings
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: parseInt(summary?.warns) > 0 ? "#744210" : "#1a202c",
              lineHeight: 1,
            }}
          >
            {loading ? "—" : fmt(summary?.warns)}
          </div>
          <div style={{ fontSize: "10px", color: "#a0aec0", marginTop: "2px" }}>
            warn level
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#a0aec0",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "2px",
            }}
          >
            Services
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1a202c",
              lineHeight: 1,
            }}
          >
            {loading ? "—" : fmt(summary?.unique_services)}
          </div>
          <div style={{ fontSize: "10px", color: "#a0aec0", marginTop: "2px" }}>
            {fmt(summary?.unique_hosts)} host
            {parseInt(summary?.unique_hosts) !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {!loading && data?.series && <ErrorRateLine series={data.series} />}
        </div>
      </div>
      <div style={{ marginTop: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "10px", color: "#a0aec0" }}>
            Log volume · click a bar to zoom into that window
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            {Object.entries(LEVEL_COLORS).map(([level, color]) => (
              <span
                key={level}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  color: "#a0aec0",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "2px",
                    background: color,
                    display: "inline-block",
                  }}
                />
                {level}
              </span>
            ))}
          </div>
        </div>
        {loading ? (
          <div
            style={{
              height: "64px",
              display: "flex",
              alignItems: "center",
              color: "#a0aec0",
              fontSize: "12px",
            }}
          >
            Loading...
          </div>
        ) : (
          <VolumeChart
            series={data?.series || []}
            rangeLabel={activeRange}
            onBucketClick={handleBucketClick}
          />
        )}
      </div>
    </div>
  );
};

export default LogsInsightStrip;
