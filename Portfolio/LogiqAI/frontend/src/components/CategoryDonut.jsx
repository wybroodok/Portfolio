import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { CATEGORICAL, PALETTE } from "../theme";

export default function CategoryDonut({ categories }) {
  const total = categories.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Tooltip
            content={
              <ChartTooltip formatter={(v) => `${v}  ·  ${Math.round((v / total) * 100)}%`} />
            }
          />
          <Pie
            data={categories}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={104}
            paddingAngle={3}
            stroke={PALETTE.surface}
            strokeWidth={2}
            animationDuration={900}
          >
            {categories.map((_, i) => (
              <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="legend">
        {categories.map((c, i) => (
          <span className="legend-item" key={c.name}>
            <span
              className="legend-swatch"
              style={{ background: CATEGORICAL[i % CATEGORICAL.length] }}
            />
            {c.name}
            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginLeft: 2 }}>
              {Math.round((c.value / total) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
