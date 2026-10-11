import { COLORS } from "./widgets";

/** Vertical bar chart with gridlines and value labels. data = [{ l, v, color? }] */
export function BarChart({ data, height = 190, unit = "" }) {
  const W = 460, H = height, padL = 30, padB = 26, padT = 18;
  if (!data.some((d) => d.v > 0)) return <p className="sub">No appointments to chart yet — bar graph appears once bookings exist.</p>;
  const max = Math.max(1, ...data.map((d) => d.v));
  const step = Math.max(1, Math.ceil(max / 4));
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  const slot = (W - padL - 10) / Math.max(1, data.length);
  const bw = Math.min(40, slot * 0.6);
  const y = (v) => H - padB - (v / top) * (H - padB - padT);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Bar chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - 6} y1={y(t)} y2={y(t)} stroke="#e6edf8" />
          <text x={padL - 6} y={y(t) + 3} fontSize="10" textAnchor="end" fill="#667a99">{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + i * slot + (slot - bw) / 2;
        const h = H - padB - y(d.v);
        return (
          <g key={d.l}>
            <rect x={x} y={y(d.v)} width={bw} height={Math.max(0, h)} rx="5" fill={d.color || COLORS[i % COLORS.length]} />
            <text x={x + bw / 2} y={y(d.v) - 5} fontSize="11" fontWeight="700" textAnchor="middle" fill="#10264d">{d.v}{unit}</text>
            <text x={x + bw / 2} y={H - 8} fontSize="10" textAnchor="middle" fill="#667a99">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Pie chart with legend. data = [{ l, v, color? }]; zero-value slices are skipped. */
export function PieChart({ data, label = "Total" }) {
  const items = data.filter((d) => d.v > 0);
  const total = items.reduce((s, d) => s + d.v, 0);
  if (!total) return <p className="sub">No appointments to chart yet — pie chart appears once bookings exist.</p>;
  const R = 60, cx = 70, cy = 70;
  let ang = -Math.PI / 2;
  const pt = (a) => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  const colorOf = (d) => d.color || COLORS[data.indexOf(d) % COLORS.length];
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={label}>
        {items.length === 1 ? (
          <circle cx={cx} cy={cy} r={R} fill={colorOf(items[0])} />
        ) : (
          items.map((d) => {
            const a2 = ang + (d.v / total) * 2 * Math.PI;
            const [x1, y1] = pt(ang), [x2, y2] = pt(a2);
            const path = `M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 ${a2 - ang > Math.PI ? 1 : 0} 1 ${x2} ${y2}Z`;
            ang = a2;
            return <path key={d.l} d={path} fill={colorOf(d)} stroke="#fff" strokeWidth="2" />;
          })
        )}
      </svg>
      <ul className="legend">
        {items.map((d) => (
          <li key={d.l}><i style={{ background: colorOf(d) }} />{d.l} <small>({d.v})</small><b>{Math.round((d.v / total) * 100)}%</b></li>
        ))}
      </ul>
    </div>
  );
}
