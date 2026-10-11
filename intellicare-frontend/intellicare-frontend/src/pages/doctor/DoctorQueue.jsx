import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { queueFor, riskFor, riskLabel } from "../../utils/queue";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import { DemoBanner, PageHead, patientDetails } from "./helpers";

export default function DoctorQueue({ doctor }) {
  const { users, appointments, callNext, callPatient, noShow, loadDemoData, clearDemoData } = useApp();
  const [openId, setOpenId] = useState(null);
  const q = queueFor(appointments, doctor.id);

  return (
    <section className="panel">
      <PageHead title={`Live Queue (${q.length})`} sub="Waiting patients in order. Urgent cases are placed first.">
        {q.length > 0 && <button className="primary" onClick={() => callNext(doctor.id)}>Call Next ({q[0].token})</button>}
      </PageHead>

      {!q.length && <Empty title="The live queue is empty">Patients who book appointments for today will automatically appear here.</Empty>}
      {!appointments.some((a) => a.doctorId === doctor.id) && <DemoBanner onLoad={() => loadDemoData(doctor.id)} />}

      {q.map((a, i) => {
        const risk = riskFor(appointments, a.patientId);
        const p = patientDetails(users, a.patientId, a.patient);
        const open = openId === a.id;
        return (
          <div className="row queue-row" key={a.id}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div className="queue-pos-badge">#{i + 1}</div>
              <Avatar name={a.patient} urgent={a.priority === "urgent"} />
              <div>
                <div><span className="tk">{a.token}</span><strong>{a.patient}</strong><span className="sub" style={{ marginLeft: 8 }}>({p.age}, {p.gender})</span></div>
                <div className="sub" style={{ marginTop: 2 }}>Booked for <strong>{a.time}</strong> • Estimated wait: <strong style={{ color: "var(--deep)" }}>~{i * (doctor.avg || 10)} min</strong></div>
                {open && (
                  <div className="p-details-inline" style={{ marginTop: 8 }}>
                    <span>🩸 Blood: <strong>{p.bloodGroup}</strong></span>
                    <span>📞 Phone: <strong>{p.phone}</strong></span>
                    <span>⚠️ Allergies: <strong style={{ color: p.allergies !== "None" ? "var(--red)" : "inherit" }}>{p.allergies}</strong></span>
                    <span>🚨 Emergency: <strong>{p.emergencyContact}</strong></span>
                  </div>
                )}
              </div>
            </div>
            <div className="acts">
              <Badge status="waiting" priority={a.priority} />
              <span className={`risk ${riskLabel(risk).toLowerCase()}`}>No-show: {riskLabel(risk)}</span>
              <button className="ghost" onClick={() => setOpenId(open ? null : a.id)}>{open ? "Hide Details" : "View Details"}</button>
              <button className="primary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => callPatient(a.id)}>Call In</button>
              <button className="ghost danger" onClick={() => noShow(a.id)}>Mark No-Show</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
