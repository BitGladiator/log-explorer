import { useEffect, useState, useCallback } from "react";
import { getLogTimeseries } from "../api/client.js";
import Spinner from "./Spinner.jsx";

const TIME_RANGES = [
  { label: "1h", ms: 60 * 60 * 1000, buckets: 12 },
  { label: "6h", ms: 6 * 60 * 60 * 1000, buckets: 24 },
  { label: "24h", ms: 24 * 60 * 60 * 1000, buckets: 24 },
  { label: "7d", ms: 7 * 24 * 60 * 60 * 1000, buckets: 28 },
  { label: "30d", ms: 30 * 24 * 60 * 60 * 1000, buckets: 30 },
];

const LEVEL_COLORS = {
  debug: "#cbd5e1",
  info: "#60a5fa",
  warn: "#fbbf24",
  error: "#f87171",
  fatal: "#dc2626",
};

const VolumeChart = ({ series, rangeLabel, onBucketClick }) => {
  const [hovered, setHovered] = useState(null);

  if (!series || series.length === 0) {
    return (
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 12,
          border: "1px dashed #e2e8f0",
          borderRadius: 8,
        }}
      >
        No logs in this time range
      </div>
    );
  }

  const max = Math.max(...series.map((s) => parseInt(s.total)), 1);

  const formatLabel = (bucket) => {
    const d = new Date(bucket);
    if (rangeLabel === "1h" || rangeLabel === "6h" || rangeLabel === "24h") {
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
        style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 64 }}
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
          const isHov = hovered === i;

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
              {isHov && total > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1e293b",
                    color: "#f1f5f9",
                    fontSize: 10,
                    padding: "6px 10px",
                    borderRadius: 7,
                    whiteSpace: "nowrap",
                    zIndex: 20,
                    lineHeight: 1.7,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{formatLabel(s.bucket)}</div>
                  <div>{total.toLocaleString()} logs</div>
                  {parseInt(s.error) + parseInt(s.fatal) > 0 && (
                    <div style={{ color: LEVEL_COLORS.error }}>
                      {parseInt(s.error) + parseInt(s.fatal)} errors
                    </div>
                  )}
                  {parseInt(s.warn) > 0 && (
                    <div style={{ color: LEVEL_COLORS.warn }}>
                      {s.warn} warnings
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  opacity: isHov ? 1 : 0.85,
                  transition: "opacity 0.1s",
                }}
              >
                {fatalPct > 0 && (
                  <div
                    style={{
                      flex: fatalPct,
                      background: LEVEL_COLORS.fatal,
                      borderRadius: "2px 2px 0 0",
                      minHeight: 2,
                    }}
                  />
                )}
                {errorPct > 0 && (
                  <div
                    style={{
                      flex: errorPct,
                      background: LEVEL_COLORS.error,
                      borderRadius: fatalPct === 0 ? "2px 2px 0 0" : 0,
                      minHeight: 2,
                    }}
                  />
                )}
                {warnPct > 0 && (
                  <div
                    style={{
                      flex: warnPct,
                      background: LEVEL_COLORS.warn,
                      borderRadius:
                        fatalPct === 0 && errorPct === 0 ? "2px 2px 0 0" : 0,
                      minHeight: 2,
                    }}
                  />
                )}
                {infoPct > 0 && (
                  <div
                    style={{
                      flex: infoPct,
                      background: LEVEL_COLORS.info,
                      borderRadius:
                        fatalPct === 0 && errorPct === 0 && warnPct === 0
                          ? "2px 2px 0 0"
                          : 0,
                      minHeight: 2,
                    }}
                  />
                )}
                {debugPct > 0 && (
                  <div
                    style={{
                      flex: debugPct,
                      background: LEVEL_COLORS.debug,
                      borderRadius: heightPct === debugPct ? "2px 2px 0 0" : 0,
                      minHeight: 1,
                    }}
                  />
                )}
                {total === 0 && (
                  <div
                    style={{
                      height: 2,
                      background: "#f1f5f9",
                      borderRadius: 2,
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
          marginTop: 5,
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
            <span key={i} style={{ fontSize: 10, color: "#94a3b8" }}>
              {series[i] ? formatLabel(series[i].bucket) : ""}
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
    return total === 0
      ? 0
      : ((parseInt(s.error) + parseInt(s.fatal)) / total) * 100;
  });
  const max = Math.max(...rates, 1);
  const W = 100,
    H = 24;
  const points = rates
    .map((r, i) => `${(i / (rates.length - 1)) * W},${H - (r / max) * H}`)
    .join(" ");
  const hasErrors = rates.some((r) => r > 0);
  const avgRate = rates.reduce((s, r) => s + r, 0) / rates.length;

  if (!hasErrors) {
    return (
      <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
        0% error rate
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        alignItems: "flex-end",
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="err-grad-light" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={LEVEL_COLORS.error}
              stopOpacity="0.2"
            />
            <stop
              offset="100%"
              stopColor={LEVEL_COLORS.error}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${points} ${W},${H}`}
          fill="url(#err-grad-light)"
        />
        <polyline
          points={points}
          fill="none"
          stroke={LEVEL_COLORS.error}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ fontSize: 11, color: "#be123c", fontWeight: 600 }}>
        {avgRate.toFixed(1)}% avg error rate
      </span>
    </div>
  );
};

const MiniStat = ({ label, value, color, sub }) => (
  <div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        color: "#94a3b8",
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: color || "#0f172a",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{sub}</div>
    )}
  </div>
);

const LogsInsightStrip = ({ projectId, onTimeRangeChange }) => {
  const [activeRange, setActiveRange] = useState("24h");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    fetchTimeseries(activeRange, undefined, undefined, false);
  }, [activeRange, fetchTimeseries]);

  const handleRangeClick = (label) => {
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

    setLoading(true);
    getLogTimeseries(projectId, { from, to, buckets: 12 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

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
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "14px 20px",
        flexShrink: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#94a3b8",
            marginRight: 4,
            fontWeight: 500,
          }}
        >
          Range
        </span>
        {TIME_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => handleRangeClick(r.label)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 6,
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              borderColor: activeRange === r.label ? "#14b8a6" : "#e2e8f0",
              background: activeRange === r.label ? "#f0fdfa" : "#f8fafc",
              color: activeRange === r.label ? "#0d9488" : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: showCustom ? "#f1f5f9" : "#f8fafc",
            color: "#64748b",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Custom
        </button>
        {showCustom && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 4,
            }}
          >
            <input
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                outline: "none",
                color: "#1e293b",
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>to</span>
            <input
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                outline: "none",
                color: "#1e293b",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleCustomApply}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                background: "#0d9488",
                color: "#fff",
                border: "1px solid #0d9488",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
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
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          gap: 16,
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <MiniStat
          label="Total"
          value={loading ? "—" : fmt(summary?.total)}
          sub="logs"
        />
        <MiniStat
          label="Errors"
          value={loading ? "—" : fmt(errorCount)}
          color={errorCount > 0 ? "#be123c" : undefined}
          sub={`${errorRate}% of traffic`}
        />
        <MiniStat
          label="Warnings"
          value={loading ? "—" : fmt(summary?.warns)}
          color={parseInt(summary?.warns) > 0 ? "#b45309" : undefined}
          sub="warn level"
        />
        <MiniStat
          label="Services"
          value={loading ? "—" : fmt(summary?.unique_services)}
          sub={`${fmt(summary?.unique_hosts)} host${
            parseInt(summary?.unique_hosts) !== 1 ? "s" : ""
          }`}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {!loading && data?.series && <ErrorRateLine series={data.series} />}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            Log volume · click a bar to zoom into that window
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            {Object.entries(LEVEL_COLORS).map(([level, color]) => (
              <span
                key={level}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "#94a3b8",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
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
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            <Spinner size={28} color1="#e2e8f0" color2="#289E49" />
            Loading chart…
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
