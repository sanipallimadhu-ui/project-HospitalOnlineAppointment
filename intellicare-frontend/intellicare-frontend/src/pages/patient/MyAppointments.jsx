import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { waitMinutes } from "../../utils/queue";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import { freeSlots } from "../../utils/schedule";
import TokenQRModal from "../../components/TokenQRModal";

export default function MyAppointments({ list }) {
  const { doctors, appointments, cancel, reschedule } = useApp();
  const [editing, setEditing] = useState(null);
  const [qrAppt, setQrAppt] = useState(null);

  if (!list.length)
    return <section className="panel"><Empty title="No appointments yet">Use "Book a visit" to get your first token.</Empty></section>;

  const sorted = [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <section className="panel">
        <h2>My appointments</h2>
        <p className="sub">View your booked tokens, scan QR codes for full clinical history, or manage appointments.</p>
        {sorted.map((a) => {
          const doc = doctors.find((d) => d.id === a.doctorId);
          if (!doc) return null;
          const canEdit = a.status === "waiting";
          return (
            <div className="row" key={a.id}>
              <div>
                <span className="tk">{a.token}</span>
                <strong>{doc.name}</strong> ({doc.dept}) on {a.date} at {a.time}
                {a.reason && <div className="sub">{a.reason}</div>}
                {canEdit && <div className="sub">Estimated wait once queue starts: about {waitMinutes(appointments, a, doc)} min</div>}
              </div>
              <div className="acts">
                <Badge status={a.status} priority={a.priority} />
                <button className="ghost qr-btn" onClick={() => setQrAppt(a)} title="View QR Code & Medical History">
                  📱 Scan QR
                </button>
                {canEdit && (editing === a.id ? (
                  <select autoFocus defaultValue="" onChange={(e) => { reschedule(a.id, e.target.value); setEditing(null); }}>
                    <option value="" disabled>Pick a time</option>
                    {freeSlots(doc, a.date, appointments).map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : <button className="ghost" onClick={() => setEditing(a.id)}>Reschedule</button>)}
                {canEdit && <button className="ghost danger" onClick={() => cancel(a.id)}>Cancel</button>}
              </div>
            </div>
          );
        })}
      </section>

      {qrAppt && <TokenQRModal appointment={qrAppt} onClose={() => setQrAppt(null)} />}
    </>
  );
}
