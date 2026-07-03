import { motion } from "framer-motion";

function fmt(value, unit) {
  // Money-like values get thousands separators; leave small counts plain.
  if (unit === "$") return "$" + Number(value).toLocaleString();
  if (Math.abs(value) >= 1000) return Number(value).toLocaleString();
  return String(value);
}

export default function MetricCard({ metric, index }) {
  const trend = metric.trend || 0;
  const cls = trend > 0 ? "up" : trend < 0 ? "down" : "flat";
  const arrow = trend > 0 ? "▲" : trend < 0 ? "▼" : "—";
  const showUnit = metric.unit && metric.unit !== "$";

  return (
    <motion.div
      className="panel metric-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <div className="metric-label">{metric.label}</div>
      <div className="metric-value">
        {fmt(metric.value, metric.unit)}
        {showUnit && <span className="unit">{metric.unit}</span>}
      </div>
      {trend !== 0 && (
        <div className={`metric-trend ${cls}`}>
          {arrow} {Math.abs(trend)}
          {metric.unit === "%" || metric.unit === "/100" ? "" : ""}
        </div>
      )}
      {metric.hint && <div className="metric-hint">{metric.hint}</div>}
    </motion.div>
  );
}
