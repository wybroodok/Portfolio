import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PRIORITY } from "../theme";

const ORDER = ["critical", "important", "tip"];

function RecCard({ rec, index }) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      className={`panel rec-card ${rec.priority}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.045 }}
    >
      <h4
        style={{ cursor: "pointer", display: "flex", gap: 8, alignItems: "flex-start" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 1 }}>
          {open ? "▾" : "▸"}
        </span>
        {rec.title}
      </h4>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            {rec.description}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Recommendations({ recommendations }) {
  const grouped = ORDER.map((p) => ({
    priority: p,
    items: recommendations.filter((r) => r.priority === p),
  })).filter((g) => g.items.length);

  let idx = 0;
  return (
    <div className="rec-groups">
      {grouped.map((group) => {
        const meta = PRIORITY[group.priority];
        return (
          <div key={group.priority}>
            <div className="rec-group-head">
              <span className={`rec-badge ${group.priority}`}>
                <span className="rb-ico">{meta.icon}</span> {meta.label}
              </span>
              <span className="rec-count">
                {group.items.length} finding{group.items.length > 1 ? "s" : ""}
              </span>
            </div>
            {group.items.map((rec) => (
              <RecCard key={rec.title} rec={rec} index={idx++} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
