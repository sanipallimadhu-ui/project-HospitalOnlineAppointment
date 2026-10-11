export const isDone = (s) => s === "done" || s === "completed";
export const isLive = (s) => s === "in-consult" || s === "in-progress";

export const patientDetails = (users, patientId, fallbackName) => {
  const p = users.find((u) => u.id === patientId);
  return {
    name: p?.name || fallbackName || "Patient",
    id: p?.id || patientId || "N/A",
    phone: p?.phone || "+91 98765 43210",
    bloodGroup: p?.bloodGroup || "O+",
    age: p?.age || "28 yrs",
    gender: p?.gender || "Female",
    allergies: p?.allergies || "None",
    emergencyContact: p?.emergencyContact || "+91 98765 11223 (Family)",
  };
};

export const countBy = (list, keyFn) =>
  Object.entries(list.reduce((acc, a) => { const k = keyFn(a); acc[k] = (acc[k] || 0) + 1; return acc; }, {}))
    .map(([l, v]) => ({ l, v }));

export const STATUS_META = {
  waiting: { l: "Waiting", color: "#f5b73b" },
  "in-progress": { l: "In Progress", color: "#2f6fe4" },
  completed: { l: "Completed", color: "#10b981" },
  cancelled: { l: "Cancelled", color: "#ef6a5b" },
  "no-show": { l: "No Show", color: "#8b5cf6" },
};
export const statusKey = (s) => (isLive(s) ? "in-progress" : isDone(s) ? "completed" : s);

export const statusPie = (list) =>
  Object.entries(STATUS_META).map(([k, m]) => ({ l: m.l, color: m.color, v: list.filter((a) => statusKey(a.status) === k).length }));

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head">
    <div><h2>{title}</h2>{sub && <p className="sub">{sub}</p>}</div>
    {children && <div className="page-head-actions">{children}</div>}
  </div>
);

export const DemoBanner = ({ onLoad, onClear, hasDemo }) => (
  <section className="panel demo-banner">
    <div>
      <strong>{hasDemo ? "Sample data is loaded" : "No appointments yet"}</strong>
      <p className="sub">{hasDemo ? "You are viewing sample patients and appointments." : "Charts and the live queue fill up when patients book with you. Load sample data to see them working."}</p>
    </div>
    {hasDemo ? <button className="ghost" onClick={onClear}>Remove sample data</button> : <button className="primary" onClick={onLoad}>Load sample data</button>}
  </section>
);
