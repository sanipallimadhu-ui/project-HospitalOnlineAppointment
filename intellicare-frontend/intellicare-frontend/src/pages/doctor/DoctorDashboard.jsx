import { DoctorHome } from "../Homes";
import { useApp } from "../../context/AppContext";
import { queueFor, today } from "../../utils/queue";
import { formatDocHours } from "../../utils/schedule";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import DoctorPatientRecords from "./DoctorPatientRecords";
import DoctorQueue from "./DoctorQueue";
import DoctorNotifications from "./DoctorNotifications";
import DoctorAvailability from "./DoctorAvailability";
import { TodayAppointments, UpcomingAppointments } from "./DoctorAppointments";
import useDoctorRoute from "./useDoctorRoute";
import { DemoBanner, isLive, patientDetails } from "./helpers";

export default function DoctorDashboard() {
  const { user, users, doctors, appointments, notifications, callNext, completeAppointment, setDoctorAvailability, loadDemoData, clearDemoData } = useApp();
  const [route, go] = useDoctorRoute();

  const doctor = doctors.find((d) => d.id === user?.doctorId);
  if (!doctor) {
    return (
      <section className="panel">
        <Empty title="Doctor profile missing">Please ask an administrator to assign your doctor profile.</Empty>
      </section>
    );
  }

  const mineAll = appointments.filter((a) => a.doctorId === doctor.id);
  const todayAppts = mineAll.filter((a) => a.date === today());
  const upcoming = mineAll.filter((a) => a.date > today() && a.status !== "cancelled");
  const q = queueFor(appointments, doctor.id);
  const current = todayAppts.find((a) => isLive(a.status));
  const unread = (notifications || []).filter((n) => (!n.doctorId || n.doctorId === doctor.id) && !n.read).length;
  const isAvailable = doctor.available !== false;
  const cp = current ? patientDetails(users, current.patientId, current.patient) : null;

  const NAV = [
    ["home", "🏠 Dashboard"],
    ["queue", `🔴 Live Queue (${q.length})`],
    ["today", `📅 Today's Appointments (${todayAppts.length})`],
    ["upcoming", `🗓️ Upcoming Appointments (${upcoming.length})`],
    ["records", "📋 Patient Records"],
    ["schedule", "⚙️ Availability & Schedule"],
    ["notifs", `🔔 Notifications${unread ? ` (${unread})` : ""}`],
  ];

  return (
    <>
      {/* Sidebar: every item is its own page (own URL), not a section of one page */}
      <nav className="tabs" aria-label="Doctor navigation">
        {NAV.map(([k, l]) => (
          <button key={k} className={route === k ? "on" : ""} aria-current={route === k ? "page" : undefined} onClick={() => go(k)}>{l}</button>
        ))}
      </nav>

      {route === "home" && (
        <>
          <section className="panel head doc-head">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2>{doctor.name}</h2>
                <button className={`doc-status-badge ${isAvailable ? "available" : "away"}`} onClick={() => setDoctorAvailability(doctor.id, !isAvailable)} title="Click to toggle availability">
                  {isAvailable ? "🟢 On Duty / Available" : "🟡 On Break / Away"}
                </button>
              </div>
              <p className="sub" style={{ margin: "4px 0 0" }}>{doctor.dept} • {formatDocHours(doctor)} • ~{doctor.avg || 10} min per visit</p>
            </div>
            <div className="doc-head-actions">
              <button className={`ghost notif-bell-btn ${unread ? "has-unread" : ""}`} onClick={() => go("notifs")}>
                🔔 Notifications {unread > 0 && <span className="notif-count">{unread}</span>}
              </button>
              <button className="primary" onClick={() => callNext(doctor.id)} disabled={!q.length && !current}>
                {current ? (q.length ? "Finish & Call Next" : "Complete Current Visit") : "Call Next Patient"}
              </button>
            </div>
          </section>

          <section className={`panel current-patient-hero ${current ? "has-current" : "empty-room"}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="lbl" style={{ margin: "0 0 4px", color: "var(--teal)", textTransform: "uppercase", fontSize: 12, letterSpacing: "0.05em" }}>
                  Room Status: {current ? "Currently In Consultation" : "Consultation Room Free"}
                </div>
                {current ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="big-token-pill">{current.token}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 22 }}>{current.patient}</h3>
                      <div className="sub">Booked for {current.time} • Priority: <strong style={{ textTransform: "capitalize" }}>{current.priority}</strong></div>
                    </div>
                  </div>
                ) : (
                  <p className="sub" style={{ margin: "4px 0 0", fontSize: 15 }}>
                    {q.length ? `${q.length} patient(s) waiting in the live queue. Click "Call Next Patient" to begin.` : "No patients are waiting in the queue right now."}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {current && <Badge status="in-progress" priority={current.priority} />}
                {current && <button className="primary complete-btn" onClick={() => completeAppointment(current.id)}>✓ Mark Patient as Completed</button>}
                {!current && q.length > 0 && <button className="primary" onClick={() => callNext(doctor.id)}>⏩ Call Next Patient ({q[0]?.token})</button>}
              </div>
            </div>
            {current && cp && (
              <div className="patient-basic-card" style={{ marginTop: 16 }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--deep)" }}>Patient Basic Details (Health ID: <code>{cp.id}</code>)</h4>
                <div className="p-details-grid">
                  <div><span className="sub">Age / Gender:</span> <strong>{cp.age} / {cp.gender}</strong></div>
                  <div><span className="sub">Blood Group:</span> <strong className="blood-tag">{cp.bloodGroup}</strong></div>
                  <div><span className="sub">Phone:</span> <strong>{cp.phone}</strong></div>
                  <div><span className="sub">Emergency Contact:</span> <strong>{cp.emergencyContact}</strong></div>
                  <div><span className="sub">Known Allergies:</span> <span style={{ color: cp.allergies !== "None" ? "var(--red)" : "inherit", fontWeight: 700 }}>{cp.allergies}</span></div>
                </div>
              </div>
            )}
          </section>

          {(!mineAll.length || appointments.some((a) => a.demo)) && <DemoBanner hasDemo={appointments.some((a) => a.demo)} onLoad={() => loadDemoData(doctor.id)} onClear={clearDemoData} />}
          <DoctorHome go={go} />
        </>
      )}

      {route === "queue" && <DoctorQueue doctor={doctor} />}
      {route === "today" && <TodayAppointments doctor={doctor} />}
      {route === "upcoming" && <UpcomingAppointments doctor={doctor} />}
      {route === "records" && <DoctorPatientRecords doctorId={doctor.id} />}
      {route === "schedule" && <DoctorAvailability doctor={doctor} />}
      {route === "notifs" && <DoctorNotifications doctor={doctor} />}
    </>
  );
}
