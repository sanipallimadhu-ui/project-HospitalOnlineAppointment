import Logo from "./Logo";
import { useApp } from "../context/AppContext";

const initials = (n = "") => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Header() {
  const { user, logout } = useApp();
  return (
    <header className="top">
      <div className="brand"><Logo />IntelliCare</div>
      <label className="topsearch">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input aria-label="Search" placeholder="Search doctors, patients, appointments..." />
      </label>
      <div className="who">
        <span className="bell" aria-label="Notifications"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" /></svg><i /></span>
        <span className="av me">{initials(user.name)}</span>
        <span className="me-t"><strong>{user.name}</strong><em>{user.role}</em></span>
        <button className="ghost" onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
