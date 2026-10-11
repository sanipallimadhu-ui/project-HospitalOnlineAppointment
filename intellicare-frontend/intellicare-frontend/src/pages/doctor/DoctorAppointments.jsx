import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { today } from "../../utils/queue";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import { Panel } from "../../components/widgets";
import { BarChart, PieChart } from "../../components/charts";
import { DemoBanner, PageHead, countBy, isDone, isLive, patientDetails, statusKey, statusPie } from "./helpers";

const hourOf = (t = "") => {
  const m = String(t).match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  if (m[3]) { const pm = m[3].toUpperCase() === "PM"; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
  return h;
};
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`;
const dayName = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

/* ---------------- Today's appointments ---------------- */
export function TodayAppointments({ doctor }) {
  const { users, appointments, completeAppointment, callPatient, noShow, loadDemoData, clearDemoData } = useApp();
  const [filter, setFilter] = useState("all");
  const list = appointments.filter((a) => a.doctorId === doctor.id && a.date === today())
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // Bar graph: appointments per booked hour
  const hours = list.map((a) => hourOf(a.time)).filter((h) => h !== null);
  const lo = hours.length ? Math.min(...hours) : 9, hi = hours.length ? Math.max(...hours) : 17;
  const perHour = [];
  for (let h = lo; h <= Math.max(hi, lo + 3); h += 1) perHour.push({ l: hourLabel(h), v: list.filter((a) => hourOf(a.time) === h).length });

  const shown = list.filter((a) => filter === "all" || statusKey(a.status) === filter);
  const count = (k) => list.filter((a) => statusKey(a.status) === k).length;

  return (
    <>
      <PageHead title={`Today's Appointments (${list.length})`} sub="Every appointment booked with you today, across all statuses." />
      {(!list.length || appointments.some((a) => a.demo)) && <DemoBanner hasDemo={appointments.some((a) => a.demo)} onLoad={() => loadDemoData(doctor.id)} onClear={clearDemoData} />}
      {list.length > 0 && <div className="appt-charts">
        <Panel title="Appointments by hour"><BarChart data={perHour} /></Panel>
        <Panel title="Status breakdown"><PieChart data={statusPie(list)} label="Today" /></Panel>
        <Panel title="Priority split"><PieChart data={countBy(list, (a) => (a.priority === "urgent" ? "Urgent" : "Normal")).map((d) => ({ ...d, color: d.l === "Urgent" ? "#ef6a5b" : "#2f6fe4" }))} label="Priority" /></Panel>
      </div>}

      <section className="panel">
        <div className="seg" style={{ margin: "0 0 12px" }}>
          {[["all", `All (${list.length})`], ["waiting", `Waiting (${count("waiting")})`], ["in-progress", `In Progress (${count("in-progress")})`], ["completed", `Completed (${count("completed")})`], ["cancelled", `Cancelled (${count("cancelled")})`], ["no-show", `No Show (${count("no-show")})`]]
            .map(([k, l]) => <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        {!shown.length ? <Empty title="No appointments match this filter">Try another status above.</Empty> : shown.map((a) => {
          const p = patientDetails(users, a.patientId, a.patient);
          return (
            <div className="row" key={a.id}>
              <div>
                <span className="tk">{a.token}</span><strong>{a.patient}</strong><span className="sub" style={{ marginLeft: 6 }}>({p.age}, {p.gender})</span>
                <div className="sub" style={{ marginTop: 2 }}>Time: {a.time} • Contact: {p.phone} • Blood: {p.bloodGroup}</div>
              </div>
              <div className="acts">
                <Badge status={a.status} priority={a.priority} />
                {isLive(a.status) && <button className="primary" style={{ padding: "6px 13px", fontSize: 13 }} onClick={() => completeAppointment(a.id)}>✓ Complete Visit</button>}
                {a.status === "waiting" && <button className="primary" style={{ padding: "6px 13px", fontSize: 13 }} onClick={() => callPatient(a.id)}>Call Patient</button>}
                {a.status === "waiting" && <button className="ghost danger" onClick={() => noShow(a.id)}>Mark No-Show</button>}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

/* ---------------- Upcoming appointments ---------------- */
export function UpcomingAppointments({ doctor }) {
  const { users, appointments, loadDemoData, clearDemoData } = useApp();
  const list = appointments
    .filter((a) => a.doctorId === doctor.id && a.date > today() && a.status !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // Bar graph: next 7 days
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d.toLocaleDateString("en-CA"); });
  const perDay = days.map((d) => ({ l: dayName(d), v: list.filter((a) => a.date === d).length }));
  const later = list.filter((a) => a.date > days[6]).length;

  return (
    <>
      <PageHead title={`Upcoming Appointments (${list.length})`} sub="Future bookings, excluding cancelled ones." />
      {(!list.length || appointments.some((a) => a.demo)) && <DemoBanner hasDemo={appointments.some((a) => a.demo)} onLoad={() => loadDemoData(doctor.id)} onClear={clearDemoData} />}
      {list.length > 0 && <div className="appt-charts two">
        <Panel title="Next 7 days"><BarChart data={perDay} />{later > 0 && <p className="chart-note">+ {later} more booked beyond the next 7 days.</p>}</Panel>
        <Panel title="Reasons for visit"><PieChart data={countBy(list, (a) => (a.reason || "Consultation").trim() || "Consultation").sort((a, b) => b.v - a.v).slice(0, 5)} label="Upcoming" /></Panel>
      </div>}

      <section className="panel">
        {!list.length ? <Empty title="No upcoming bookings">Appointments booked for tomorrow and later will appear here.</Empty> : list.map((a) => {
          const p = patientDetails(users, a.patientId, a.patient);
          return (
            <div className="row" key={a.id}>
              <div>
                <span className="tk">{a.token}</span><strong>{a.patient}</strong><span className="sub" style={{ marginLeft: 6 }}>({p.age}, {p.gender})</span>
                <div className="sub" style={{ marginTop: 2 }}>📅 <strong>{a.date}</strong> at <strong>{a.time}</strong> • Phone: {p.phone}</div>
                <div className="sub">Emergency Contact: {p.emergencyContact} • Allergies: {p.allergies}</div>
              </div>
              <div className="acts"><Badge status={a.status} priority={a.priority} /></div>
            </div>
          );
        })}
      </section>
    </>
  );
}
