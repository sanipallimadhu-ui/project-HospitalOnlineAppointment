import { useState } from "react";

export const COLORS = ["#2f6fe4", "#f5b73b", "#10b981", "#ef6a5b", "#8b5cf6"];

export function Donut({ data, label = "Total" }) {
  const total = data.reduce((s, d) => s + d.v, 0) || 1;
  let acc = 0;
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={label}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#eef2fa" strokeWidth="20" />
        {data.map((d, i) => {
          const len = (d.v / total) * C, off = -acc; acc += len;
          return <circle key={d.l} cx="70" cy="70" r={R} fill="none" stroke={COLORS[i % 5]} strokeWidth="20" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={off} transform="rotate(-90 70 70)" />;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill="#10264d">{total}</text>
        <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#667a99">{label}</text>
      </svg>
      <ul className="legend">{data.map((d, i) => <li key={d.l}><i style={{ background: COLORS[i % 5] }} />{d.l}<b>{Math.round((d.v / total) * 100)}%</b></li>)}</ul>
    </div>
  );
}

export function Lines({ labels, series }) {
  const W = 420, H = 150, max = Math.max(1, ...series.flatMap((s) => s.v));
  const x = (i) => 28 + (i * (W - 40)) / Math.max(1, labels.length - 1), y = (v) => H - 22 - (v / max) * (H - 40);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Trend chart">
      {[0, 0.5, 1].map((t) => <line key={t} x1="28" x2={W - 8} y1={y(max * t)} y2={y(max * t)} stroke="#e6edf8" />)}
      {series.map((s, k) => <polyline key={s.l} fill="none" stroke={COLORS[k]} strokeWidth="2.5" strokeLinejoin="round" points={s.v.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />)}
      {labels.map((l, i) => <text key={l} x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="#667a99">{l}</text>)}
    </svg>
  );
}

export function Bars({ labels, series }) {
  const W = 420, H = 150, max = Math.max(1, ...series.flatMap((s) => s.v)), g = (W - 30) / labels.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Bar chart">
      {labels.map((l, i) => (
        <g key={l}>
          {series.map((s, k) => { const h = (s.v[i] / max) * (H - 36); return <rect key={s.l} x={24 + i * g + k * 14} y={H - 20 - h} width="11" height={h} rx="3" fill={COLORS[k]} />; })}
          <text x={24 + i * g + 12} y={H - 6} fontSize="10" textAnchor="middle" fill="#667a99">{l}</text>
        </g>
      ))}
    </svg>
  );
}

export function Meter({ rows }) {
  return <div>{rows.map(([l, v, c], i) => <div className="meter" key={l}><span>{l}</span><div><b style={{ width: v + "%", background: c || COLORS[i % 5] }} /></div><em>{v}%</em></div>)}</div>;
}

export function Calendar() {
  const [d] = useState(new Date());
  const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay(), n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  return (
    <div className="cal">
      <h3>{d.toLocaleString("en", { month: "long", year: "numeric" })}</h3>
      <div className="calg">{"SMTWTFS".split("").map((c, i) => <b key={i}>{c}</b>)}{cells.map((c, i) => <span key={i} className={c === d.getDate() ? "today" : ""}>{c}</span>)}</div>
    </div>
  );
}

export function Feed({ items }) {
  return <div>{items.map(([ic, t, s, when]) => <div className="feed" key={t + when}><span className="fi">{ic}</span><div><strong>{t}</strong><div className="sub">{s}</div></div><em>{when}</em></div>)}</div>;
}

export function Quick({ items }) {
  return <div>{items.map(([ic, l, fn]) => <button key={l} className="qa" onClick={fn}><span className="fi">{ic}</span>{l}<i>›</i></button>)}</div>;
}

export const Panel = ({ title, link, children, cls = "" }) => (
  <section className={"panel " + cls}><div className="ph"><h2>{title}</h2>{link && <span className="viewall">{link}</span>}</div>{children}</section>
);
export const Stats = ({ items }) => <div className="stats">{items.map(([n, l, d]) => <div className="stat" key={l}><div className="n">{n}</div><div className="l">{l}</div>{d && <div className="delta">{d}</div>}</div>)}</div>;
