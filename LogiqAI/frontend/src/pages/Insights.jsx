import { motion } from "framer-motion";
import { useStore } from "../store";
import Recommendations from "../components/Recommendations";
import EmptyState from "../components/EmptyState";

export default function Insights() {
  const current = useStore((s) => s.current());
  if (!current) return <EmptyState />;
  const r = current.result;

  const counts = {
    critical: r.recommendations.filter((x) => x.priority === "critical").length,
    important: r.recommendations.filter((x) => x.priority === "important").length,
    tip: r.recommendations.filter((x) => x.priority === "tip").length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-head">
        <h1>AI Insights &amp; Recommendations</h1>
        <p>Findings for {current.filename}, grouped by priority. Click a title to collapse its detail.</p>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          ["Critical", counts.critical, "var(--critical)"],
          ["Important", counts.important, "var(--important)"],
          ["Tips", counts.tip, "var(--tip)"],
        ].map(([label, count, color]) => (
          <div className="panel panel-pad" key={label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 30, fontWeight: 500, color }}>
              {count}
            </div>
            <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="section-gap">
        <Recommendations recommendations={r.recommendations} />
      </div>
    </motion.div>
  );
}
