import { useState } from "react";
import { useApp } from "../../context/AppContext";

const TYPES = ["Condition", "Surgery", "Medication", "Allergy", "Family history", "Vaccination"];

export default function MedicalHistory() {
  const { user, updateProfile } = useApp();
  const list = user?.medicalHistory || [];
  const [f, setF] = useState({ type: "Condition", title: "", since: "", notes: "" });
  const save = (next) => updateProfile({ medicalHistory: next });
  const add = (e) => {
    e.preventDefault();
    save([{ id: Date.now(), ...f }, ...list]);
    setF({ type: "Condition", title: "", since: "", notes: "" });
  };
  return (
    <section className="panel">
      <h2>Medical history</h2>
      <p className="sub">Conditions, surgeries, medicines and vaccinations. Doctors see this when you visit.</p>
      <form onSubmit={add} className="mh-form">
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <input required placeholder="e.g. Type 2 diabetes" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label="Title" />
        <input placeholder="Since (year)" value={f.since} onChange={(e) => setF({ ...f, since: e.target.value })} aria-label="Since" />
        <input placeholder="Notes (optional)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} aria-label="Notes" />
        <button className="primary" type="submit">Add</button>
      </form>
      {list.length === 0 ? <p className="sub" style={{ marginTop: 14 }}>No history added yet.</p> : list.map((h) => (
        <div className="row" key={h.id}>
          <div className="rl"><span className="tag" style={{ margin: 0 }}>{h.type}</span><div><strong>{h.title}</strong><div className="sub">{[h.since && `Since ${h.since}`, h.notes].filter(Boolean).join(" · ")}</div></div></div>
          <button className="ghost danger" onClick={() => save(list.filter((x) => x.id !== h.id))}>Remove</button>
        </div>
      ))}
    </section>
  );
}
