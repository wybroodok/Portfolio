import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store";

const STEPS = [
  "Parsing document…",
  "Extracting structure…",
  "Running audit heuristics…",
  "Scoring against benchmarks…",
  "Synthesizing recommendations…",
];

/** Calm progress panel — a counter, a status line, and a thin bar. No spinners. */
export default function CyberLoader() {
  const progress = useStore((s) => s.progress);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStepIdx((i) => (i + 1) % STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div className="panel panel-pad" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="loader-wrap">
        <div className="loader-pct">{Math.round(progress)}%</div>
        <motion.div
          key={stepIdx}
          className="loader-status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {STEPS[stepIdx]}
        </motion.div>
        <div className="loader-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </motion.div>
  );
}
