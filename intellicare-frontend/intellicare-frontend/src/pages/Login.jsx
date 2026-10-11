import { useState } from "react";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import DoctorFields, { DEFAULT_DOCTOR } from "../components/DoctorFields";

export default function Login() {
  const { login, register } = useApp();
  const [mode, setMode] = useState("in");
  const [f, setF] = useState({ name: "", email: "", password: "", role: "patient" });
  const [doc, setDoc] = useState(DEFAULT_DOCTOR);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setErr(mode === "in" ? login(f.email) : register({ ...f, ...doc }));
  };

  return (
    <div className="login-wrap">
      <div className="login-side">
        <div>
          <div className="brand"><Logo />IntelliCare</div>
          <h1>Less waiting.<br />More care.</h1>
          <p>Book visits, follow your place in line, and see how long you will wait.</p>
        </div>
        <div className="perks">
          <div><i />Digital tokens and live queue</div>
          <div><i />Estimated waiting time</div>
          <div><i />Urgent requests moved up</div>
        </div>
      </div>
      <form className="login" onSubmit={submit}>
        <h2>{mode === "in" ? "Welcome back" : "Create your account"}</h2>
        <p className="lead">{mode === "in" ? "Sign in with your email." : "Choose your role and enter your details."}</p>
        {mode === "up" && (
          <>
            <div className="seg">
              {["patient", "doctor", "receptionist", "admin"].map((r) => (
                <button type="button" key={r} className={f.role === r ? "on" : ""} onClick={() => setF({ ...f, role: r })}>{r}</button>
              ))}
            </div>
            <label>Full name<input required value={f.name} onChange={set("name")} /></label>
          </>
        )}
        <label>Email<input required type="email" value={f.email} onChange={set("email")} /></label>
        <label>Password<input required type="password" minLength={6} value={f.password} onChange={set("password")} /></label>
        {mode === "up" && f.role === "doctor" && <DoctorFields value={doc} onChange={setDoc} />}
        {err && <p className="err" role="alert">{err}</p>}
        <button className="primary" type="submit">{mode === "in" ? "Sign in" : "Create account"}</button>
        <p className="hint">
          {mode === "in" ? "New here? " : "Already registered? "}
          <button type="button" className="link" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}>
            {mode === "in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
