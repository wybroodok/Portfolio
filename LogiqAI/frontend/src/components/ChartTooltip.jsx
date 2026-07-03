/** Custom Recharts tooltip styled to the LogiqAI design language. */
export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rc-tooltip">
      <div className="t-label">{label}</div>
      {payload.map((p, i) => (
        <div className="t-row" key={i}>
          <span className="t-swatch" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}</span>
          <span className="t-val">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}
