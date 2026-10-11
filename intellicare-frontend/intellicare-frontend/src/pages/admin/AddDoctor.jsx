import { useState } from "react";
import { useApp } from "../../context/AppContext";
import DoctorFields, { DEFAULT_DOCTOR } from "../../components/DoctorFields";

export default function AddDoctor() {
  const { addDoctor } = useApp();
  const [f, setF] = useState({ name: "", email: "" });
  const [doc, setDoc] = useState(DEFAULT_DOCTOR);
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const e2 = addDoctor({ ...f, ...doc });
    setErr(e2);
    if (!e2) { setF({ name: "", email: "" }); setDoc(DEFAULT_DOCTOR); }
  };
  return (
    <form className="panel" onSubmit={submit}>
      <h2>Add a doctor</h2>
      <div className="grid2">
        <label>Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Email (used to sign in)<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <DoctorFields value={doc} onChange={setDoc} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="primary" type="submit" style={{ marginTop: 14 }}>Add doctor</button>
    </form>
  );
}
