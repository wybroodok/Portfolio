import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store";
import Dropzone from "../components/Dropzone";
import CyberLoader from "../components/CyberLoader";
import MetricCard from "../components/MetricCard";
import ScoreRing from "../components/ScoreRing";

export default function Dashboard() {
  const { status, error, history, user } = useStore();
  const current = useStore((s) => s.current());
  const [showUpload, setShowUpload] = useState(false);

  if (status === "uploading") {
    return (
      <div>
        <div className="page-head">
          <h1>Analyzing…</h1>
          <p>LogiqAI is auditing your document. This runs asynchronously in the background.</p>
        </div>
        <CyberLoader />
      </div>
    );
  }

  // First-time / empty state — prominent upload.
  if (!current) {
    return (
      <div>
        <div className="page-head">
          <h1>Welcome, {user?.username}</h1>
          <p>
            Upload an artifact and LogiqAI produces a structured audit — score, key
            metrics, interactive analytics, and prioritized recommendations. Every audit
            is saved to your account.
          </p>
        </div>
        <Dropzone />
        {error && <div className="error-banner">{error}</div>}
        <div className="panel panel-pad section-gap" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            ["Code Audit", "Bugs, security & tech debt by module."],
            ["Spend Audit", "Anomalies & optimization potential."],
            ["Résumé Audit", "ATS match, gaps & impact scoring."],
          ].map(([title, desc]) => (
            <div key={title} style={{ flex: "1 1 200px" }}>
              <div className="card-title" style={{ color: "var(--accent)" }}>{title}</div>
              <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const r = current.result;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1>{r.title}</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{current.filename}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <span className="pill accent">AI analysis</span>
          <button className="btn" onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? "Close" : "New audit"}
          </button>
        </div>
      </div>

      {showUpload && (
        <div style={{ marginBottom: 24 }}>
          <Dropzone />
          {error && <div className="error-banner">{error}</div>}
        </div>
      )}

      <div className="metric-grid">
        {r.metrics.map((m, i) => (
          <MetricCard key={m.label} metric={m} index={i} />
        ))}
      </div>

      <div className="chart-grid">
        <motion.div
          className="panel panel-pad score-block"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ScoreRing score={r.score} label={r.score_label} />
          <div>
            <div className="card-title">Executive Summary</div>
            <p className="summary-text" style={{ marginTop: 8 }}>{r.summary}</p>
          </div>
        </motion.div>

        <motion.div
          className="panel panel-pad"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <div className="card-title">Optimization Potential</div>
          <div className="big-figure">{r.optimization_potential}</div>
          <p className="summary-text" style={{ marginTop: 8 }}>{r.optimization_hint}</p>
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="pill" style={{ color: "var(--critical)" }}>
              {r.critical_count} critical
            </span>
            <span className="pill">{r.recommendations.length} total findings</span>
            {history.length > 1 && <span className="pill">{history.length} audits saved</span>}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
