import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { PALETTE } from "../theme";

export default function AreaTrend({ result }) {
  const { trend, trend_primary_name, trend_baseline_name } = result;

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={trend} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE.teal} stopOpacity={0.28} />
              <stop offset="100%" stopColor={PALETTE.teal} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE.peri} stopOpacity={0.14} />
              <stop offset="100%" stopColor={PALETTE.peri} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={PALETTE.grid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={PALETTE.axis}
            tick={{ fill: PALETTE.ink3, fontSize: 12, fontFamily: "IBM Plex Mono" }}
            tickLine={false}
            axisLine={{ stroke: PALETTE.grid }}
          />
          <YAxis
            stroke={PALETTE.axis}
            tick={{ fill: PALETTE.ink3, fontSize: 12, fontFamily: "IBM Plex Mono" }}
            tickLine={false}
            axisLine={false}
            width={46}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: PALETTE.teal, strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="baseline"
            name={trend_baseline_name}
            stroke={PALETTE.peri}
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="url(#gradBaseline)"
            animationDuration={900}
            dot={false}
            activeDot={{ r: 5, fill: PALETTE.peri, stroke: PALETTE.surface, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={trend_primary_name}
            stroke={PALETTE.teal}
            strokeWidth={2.4}
            fill="url(#gradPrimary)"
            animationDuration={1100}
            dot={false}
            activeDot={{ r: 6, fill: PALETTE.teal, stroke: PALETTE.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: PALETTE.teal }} />
          {trend_primary_name}
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: PALETTE.peri }} />
          {trend_baseline_name}
        </span>
      </div>
    </div>
  );
}
