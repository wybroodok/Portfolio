import { motion } from "framer-motion";
import { useStore } from "../store";
import AreaTrend from "../components/AreaTrend";
import CategoryDonut from "../components/CategoryDonut";
import EmptyState from "../components/EmptyState";

function shortTime(iso) {
  try {
    return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Analytics() {
  const { history, selectedId, select } = useStore();
  const current = useStore((s) => s.current());
  if (!current) return <EmptyState />;

  const r = current.result;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-head">
        <h1>Analytics</h1>
        <p>Your audit history and interactive breakdowns. Hover any mark for exact figures.</p>
      </div>

      {/* Per-user history picker — analytics stay scoped to this account */}
      {history.length > 1 && (
        <div className="history-bar">
          {history.map((a) => (
            <div
              key={a.id}
              className={`history-chip ${a.id === selectedId ? "active" : ""}`}
              onClick={() => select(a.id)}
            >
              <span className="hc-score">{a.result.score}</span>
              <div>
                <div className="hc-name">{a.filename}</div>
                <div className="hc-meta">
                  {a.result.audit_type} · {shortTime(a.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="chart-grid">
        <motion.div
          className="panel panel-pad chart-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>{r.trend_title}</h3>
          <div className="chart-sub">Primary series vs. baseline comparison</div>
          <AreaTrend result={r} />
        </motion.div>

        <motion.div
          className="panel panel-pad chart-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h3>{r.categories_title}</h3>
          <div className="chart-sub">Distribution across categories</div>
          <CategoryDonut categories={r.categories} />
        </motion.div>
      </div>

      <motion.div
        className="panel panel-pad section-gap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <div className="card-title">Metric Detail</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, marginTop: 14 }}>
          {r.metrics.map((m) => (
            <div key={m.label}>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{m.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500, marginTop: 4 }}>
                {m.unit === "$" ? "$" + Number(m.value).toLocaleString() : m.value}
                {m.unit && m.unit !== "$" && (
                  <span style={{ fontSize: 13, color: "var(--ink-3)", marginLeft: 3 }}>{m.unit}</span>
                )}
              </div>
              {m.hint && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{m.hint}</div>}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
