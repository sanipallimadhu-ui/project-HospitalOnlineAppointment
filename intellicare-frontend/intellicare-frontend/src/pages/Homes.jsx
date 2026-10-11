import { useApp } from "../context/AppContext";
import { today } from "../utils/queue";
import { Donut, Lines, Bars, Meter, Calendar, Feed, Quick, Panel, Stats } from "../components/widgets";
import { BarChart, PieChart } from "../components/charts";
import Avatar from "../components/Avatar";
import Empty from "../components/Empty";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pn = (a) => a.patient || a.patientName || "Patient";
const dn = (a) => a.doctorName || a.doctor || "Doctor";
const why = (a) => a.reason || a.symptoms || a.complaint || "Consultation";
const badge = (s) => <span className={"badge " + s}>{s}</span>;
const cnt = (l, s) => l.filter((a) => a.status === s).length;
const seed = (i) => 6 + ((i * 7) % 9);

function QueueTable({ list, call }) {
  if (!list.length) return <p className="sub">No patients in the queue right now.</p>;
  return (
    <table className="tbl"><thead><tr><th>Token</th><th>Patient</th><th>Reason</th><th>Status</th>{call && <th />}</tr></thead>
      <tbody>{list.slice(0, 6).map((a) => <tr key={a.id}><td><b className="tk">{a.token}</b></td><td>{pn(a)}</td><td>{why(a)}</td><td>{badge(a.status)}</td>{call && <td><button className="primary sm" onClick={() => call(a)}>Call</button></td>}</tr>)}</tbody></table>
  );
}

export function PatientHome({ go }) {
  const { user, appointments, doctors = [] } = useApp();
  const mine = appointments.filter((a) => a.patientId === user.id && a.status !== "cancelled");
  const next = mine.filter((a) => a.date >= today())[0];
  return (
    <div className="g-main">
      <div className="col">
        <div className="qtiles">{[["📅", "Book Appointment", "book", "#e3edff"], ["🎫", "My Appointments", "mine", "#e1f7ee"], ["📱", "Health QR", "healthqr", "#efe6ff"], ["🔬", "Lab Tests", "lab", "#ffeedd"]].map(([i, l, k, c]) => <button key={k} className="qt" style={{ background: c }} onClick={() => go(k)}><span>{i}</span>{l}</button>)}</div>
        <Panel title="Upcoming appointment" link="View all">
          {next ? <div className="row"><div className="rl"><span className="av">{dn(next)[0]}</span><div><strong>{dn(next)}</strong><div className="sub">{next.date} · {next.time || next.slot || "Token " + next.token}</div></div></div>{badge(next.status)}</div> : <p className="sub">Nothing booked yet. Find a doctor to get your token.</p>}
        </Panel>
        <Panel title="Recent activity"><Feed items={[["✅", "Appointment confirmed", "Your visit is confirmed", "2h ago"], ["📄", "Medical report available", "Lab report ready to view", "1d ago"], ["💊", "Medicine reminder", "Take your evening dose", "2d ago"], ["📱", "Health QR updated", "Your QR code was refreshed", "3d ago"]]} /></Panel>
      </div>
      <div className="col side">
        <Panel title="Your Health QR"><p className="sub">Scan to share your medical details with doctors.</p><button className="primary" onClick={() => go("healthqr")}>View QR</button></Panel>
        <Panel title="Quick actions"><Quick items={[["🩺", "Find a doctor", () => go("book")], ["💊", "Buy medicines", () => go("medicines")], ["🤖", "Ask the assistant", () => go("ask")], ["👤", "My profile", () => go("profile")]]} /></Panel>
        <Panel title="Health tips"><p>💧 <strong>Stay hydrated.</strong></p><p className="sub">Drink at least 8 glasses of water every day.</p></Panel>
        <Panel title="Doctors available"><p className="sub">{doctors.length} doctors on the platform</p></Panel>
      </div>
    </div>
  );
}

export function DoctorHome({ go }) {
  const { user, appointments, users = [], notifications = [], callPatient } = useApp();
  const mine = appointments
    .filter((a) => a.doctorId === user.doctorId && a.date === today())
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const waiting = mine.filter((a) => a.status === "waiting");
  const inConsult = mine.find((a) => a.status === "in-consult" || a.status === "in-progress");
  const completed = mine.filter((a) => a.status === "done" || a.status === "completed");
  const noShows = mine.filter((a) => a.status === "no-show");
  const patient = inConsult ? users.find((u) => u.id === inConsult.patientId) : null;

  const reasonCounts = Object.entries(
    mine.reduce((acc, a) => {
      const reason = (a.reason || "Consultation").trim() || "Consultation";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lastSixDays = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i));
    return d.toLocaleDateString("en-IN", { weekday: "short" });
  });

  const dayKeys = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i));
    return d.toISOString().slice(0, 10);
  });

  const dailyCounts = dayKeys.map((key) =>
    appointments.filter((a) => a.doctorId === user.doctorId && a.date === key && ["done", "completed"].includes(a.status)).length
  );

  const recentNotifs = notifications.filter((n) => !n.doctorId || n.doctorId === user.doctorId).slice(0, 4);

  const getPatient = (a) => users.find((u) => u.id === a.patientId);
  const statusLabel = (s) => s === "in-consult" || s === "in-progress" ? "In Consultation" : s === "waiting" ? "Waiting" : s === "done" || s === "completed" ? "Completed" : s;

  return (
    <>
      <Stats items={[
        [mine.length, "Total Patients Today", "↑ compared with yesterday"],
        [waiting.length, "In Queue", waiting.length ? `${waiting.filter((a) => a.priority === "urgent").length} high priority` : "No waiting patients"],
        [completed.length, "Completed", "Today's completed visits"],
        [noShows.length, "No Shows", "Today's missed appointments"],
      ]} />

      <div className="doctor-dashboard-grid">
        <div className="doctor-dashboard-main">
          <Panel title="Live Queue" link="View all">
            <div className="queue-dashboard-table">
              <div className="queue-table-head"><span>Token</span><span>Patient</span><span>Age/Gender</span><span>Reason</span><span>Risk</span><span>Wait</span><span>Action</span></div>
              {waiting.length ? waiting.slice(0, 6).map((a, i) => {
                const p = getPatient(a);
                return (
                  <div className="queue-table-row" key={a.id}>
                    <b className="tk">{a.token}</b>
                    <span className="queue-patient"><Avatar name={a.patient} /></span>
                    <span>{p?.age || "—"} / {p?.gender || "—"}</span>
                    <span>{a.reason || "Consultation"}</span>
                    <span className={`risk ${a.priority === "urgent" ? "high" : i < 2 ? "medium" : "low"}`}>{a.priority === "urgent" ? "High" : i < 2 ? "Medium" : "Low"}</span>
                    <span>{i * 10} min</span>
                    <button className="primary sm" onClick={() => callPatient(a.id)}>Call</button>
                  </div>
                );
              }) : <Empty title="No patients waiting">The live queue is currently clear.</Empty>}
            </div>
          </Panel>

          <div className="doctor-two-panels">
            <Panel title="Today's Appointments" link="View all">
              <div className="appointment-mini-list">
                {mine.slice(0, 6).map((a) => (
                  <div className="appointment-mini-row" key={a.id}>
                    <div className="appointment-time">{a.time || "—"}</div>
                    <Avatar name={a.patient} />
                    <div className="appointment-person">
                      <strong>{a.patient}</strong>
                      <span>{a.reason || "General consultation"}</span>
                    </div>
                    <span className={`mini-status ${a.status}`}>{statusLabel(a.status)}</span>
                  </div>
                ))}
                {!mine.length && <Empty title="No appointments today">Today's appointments will appear here.</Empty>}
              </div>
            </Panel>

            <Panel title="Patient Statistics" link="This week">
              <BarChart data={lastSixDays.map((l, i) => ({ l, v: dailyCounts[i] }))} />
              <div className="chart-summary"><span>Completed visits over the last 6 days</span><strong>{completed.length} today</strong></div>
            </Panel>
          </div>

          <div className="doctor-two-panels">
            <Panel title="Top Reasons for Visit">
              {reasonCounts.length ? <PieChart label="Visits" data={reasonCounts.map(([l, v]) => ({ l, v }))} /> : <Empty title="No reason data">Appointment reasons will appear here.</Empty>}
            </Panel>

            <Panel title="Patient Details" link={inConsult ? "Current patient" : undefined}>
              {inConsult && patient ? (
                <div className="current-patient-mini">
                  <div className="record-patient-title">
                    <Avatar name={patient.name} />
                    <div><strong>{patient.name}</strong><span>{patient.age || "—"} • {patient.gender || "—"}</span></div>
                  </div>
                  <div className="mini-detail-grid">
                    <span><small>Blood Group</small><b>{patient.bloodGroup || "—"}</b></span>
                    <span><small>Allergies</small><b className={patient.allergies && patient.allergies !== "None" ? "danger-text" : ""}>{patient.allergies || "None"}</b></span>
                    <span><small>Phone</small><b>{patient.phone || "—"}</b></span>
                    <span><small>Emergency</small><b>{patient.emergencyContact || "—"}</b></span>
                  </div>
                  <button className="primary sm" onClick={() => go("records")}>View Medical History</button>
                </div>
              ) : <Empty title="No patient in consultation">Patient details will appear when a visit is in progress.</Empty>}
            </Panel>
          </div>
        </div>

        <div className="doctor-dashboard-side">
          <Panel title="Today's Schedule" link="View Full Schedule">
            <div className="schedule-block">
              <div><span className="schedule-dot on" /><strong>09:00 AM – 12:00 PM</strong><small>Consultation</small><b>{Math.min(5, mine.length)}/5</b></div>
              <div><span className="schedule-dot break" /><strong>12:00 PM – 01:00 PM</strong><small>Break</small><b>—</b></div>
              <div><span className="schedule-dot on" /><strong>01:00 PM – 04:00 PM</strong><small>Consultation</small><b>{Math.max(0, mine.length - 5)}/5</b></div>
              <div><span className="schedule-dot" /><strong>04:00 PM – 05:00 PM</strong><small>Consultation</small><b>0/5</b></div>
            </div>
          </Panel>

          <Panel title="Quick Actions">
            <Quick items={[
              ["📋", "Patient Records", () => go("records")],
              ["🗓️", "Update Availability", () => go("schedule")],
              ["🔔", "Notifications", () => go("notifs")],
              ["👥", "Today's Appointments", () => go("today")],
            ]} />
          </Panel>

          <Panel title="Notifications" link="View all">
            {recentNotifs.length ? <Feed items={recentNotifs.map((n) => ["🔔", n.title, n.message, n.time || "now"])} /> : <p className="sub">No new notifications.</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}

export function ReceptionHome({ go, noStats }) {
  const { appointments, callPatient } = useApp();
  const t = appointments.filter((a) => a.date === today());
  const live = t.filter((a) => a.status === "waiting" || a.status === "in-consult");
  return (
    <>
      {!noStats && <Stats items={[[new Set(appointments.map((a) => a.patientId)).size, "Total patients"], [t.length, "Today's appointments"], [live.length, "In queue"], [cnt(t, "completed"), "Completed"]]} />}
      <div className="g-main">
        <div className="col">
          <Panel title="Live queue" link="View all"><QueueTable list={live} call={callPatient ? (a) => callPatient(a.id) : null} /></Panel>
          <Panel title="Queue statistics"><Bars labels={["08 AM", "09 AM", "10 AM", "11 AM", "12 PM"]} series={[{ l: "Waiting", v: [3, 6, 8, 5, 4] }, { l: "In consult", v: [1, 2, 3, 2, 2] }, { l: "Completed", v: [2, 5, 7, 9, 6] }]} /></Panel>
        </div>
        <div className="col side">
          <Panel title="Quick actions"><Quick items={[["➕", "Register new patient", () => go("walkin")], ["📅", "Book appointment", () => go("appointments")], ["🩺", "View doctor schedule", () => go("doctors")], ["📷", "Scan health QR", () => go("scan")]]} /></Panel>
          <Panel title="Recent activities"><Feed items={[["✅", "Patient registered", "Walk-in desk", "now"], ["📅", "Appointment booked", "Front desk", "5m"], ["🔔", "Queue updated", "Auto", "12m"]]} /></Panel>
        </div>
      </div>
    </>
  );
}

export function AdminHome() {
  const { users = [], doctors = [], appointments, departments = [] } = useApp();
  const t = appointments.filter((a) => a.date === today());
  const dep = departments.slice(0, 5).map((d, i) => ({ l: d.name || d.id, v: 10 + ((i * 11) % 23) }));
  return (
    <>
      <Stats items={[[users.filter((u) => u.role === "patient").length, "Total patients", "↑ 12%"], [doctors.length, "Doctors", "↑ 5%"], [t.length, "Appointments today", "↑ 18%"], [appointments.length, "All appointments", "↑ 8%"]]} />
      <div className="g-main">
        <div className="col">
          <Panel title="System overview"><Lines labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]} series={[{ l: "Appointments", v: [120, 180, 160, 240, 290, 270, 340] }, { l: "Patients", v: [90, 140, 150, 190, 230, 250, 300] }]} /></Panel>
          <Panel title="Recent appointments" link="View all"><table className="tbl"><thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead><tbody>{appointments.slice(-5).reverse().map((a) => <tr key={a.id}><td>{pn(a)}</td><td>{dn(a)}</td><td>{a.date}</td><td>{badge(a.status)}</td></tr>)}</tbody></table></Panel>
        </div>
        <div className="col side">
          <Panel title="Department distribution">{dep.length ? <Donut label="Total" data={dep} /> : <p className="sub">Add departments to see the split.</p>}</Panel>
          <Panel title="Hospital statistics"><Meter rows={[["Bed occupancy", 78], ["Patient satisfaction", 96], ["No-show rate", 6]]} /></Panel>
        </div>
      </div>
    </>
  );
}
