import { motion } from "framer-motion";
import { PALETTE } from "../theme";

/** Score gauge. Flat muted stroke — colour keyed to the score, no glow. */
export default function ScoreRing({ score, label }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;

  // muted: red → gold → teal as score improves
  const color = score >= 75 ? PALETTE.teal : score >= 55 ? PALETTE.gold : "#cf6a63";

  return (
    <div className="score-ring">
      <svg width="116" height="116" viewBox="0 0 116 116">
        <circle cx="58" cy="58" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <motion.circle
          cx="58"
          cy="58"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          transform="rotate(-90 58 58)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="val">
        <div>
          <div className="num" style={{ color }}>{score}</div>
          <div className="lbl">{label}</div>
        </div>
      </div>
    </div>
  );
}
