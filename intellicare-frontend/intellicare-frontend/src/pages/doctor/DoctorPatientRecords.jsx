import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { Bars, Donut, Panel } from "../../components/widgets";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";

const monthKey = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date).slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  if (!key) return "Unknown";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-IN", { month: "short" });
};

export default function DoctorPatientRecords({ doctorId }) {
  const { user, users = [], appointments = [], medicineOrders = [], labBookings = [] } = useApp();
  const [selectedId, setSelectedId] = useState(null);

  // Frontend role guard: clinical history is rendered only inside a doctor session.
  if (user?.role !== "doctor") {
    return (
      <section className="panel">
        <Empty title="Access restricted">Medical history is available only to authorized doctors.</Empty>
      </section>
    );
  }

  const doctorAppointments = appointments
    .filter((a) => a.doctorId === doctorId)
    .sort((a, b) => `${b.date || ""}${b.time || ""}`.localeCompare(`${a.date || ""}${a.time || ""}`));

  const patientIds = [...new Set(doctorAppointments.map((a) => a.patientId).filter(Boolean))];
  const patients = patientIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  const selected = patients.find((p) => p.id === selectedId) || patients[0] || null;

  const patientAppointments = useMemo(
    () => selected ? doctorAppointments.filter((a) => a.patientId === selected.id) : [],
    [selected, doctorAppointments]
  );

  const completed = patientAppointments.filter((a) => ["done", "completed"].includes(a.status));

  const patientLabs = selected
    ? labBookings.filter((l) => l.patientId === selected.id)
    : [];

  const patientMedicines = selected
    ? medicineOrders.filter((o) => o.patientId === selected.id)
    : [];

  const visitMonths = useMemo(() => {
    const now = new Date();
    const keys = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return keys;
  }, []);

  const visitsByMonth = visitMonths.map((key) => ({
    l: monthLabel(key),
    v: completed.filter((a) => monthKey(a.date) === key).length,
  }));

  const reasons = Object.entries(
    patientAppointments.reduce((acc, a) => {
      const reason = (a.reason || "Consultation").trim() || "Consultation";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([l, v]) => ({ l, v }));

  const history = [
    ...patientAppointments.map((a) => ({
      id: `visit-${a.id}`,
      date: a.date,
      time: a.time,
      type: "Consultation",
      title: a.reason || "General consultation",
      detail: `Token ${a.token || "—"} • Priority: ${a.priority || "normal"}`,
      status: a.status,
    })),
    ...patientLabs.map((l) => ({
      id: `lab-${l.id}`,
      date: l.date,
      time: l.timeSlot,
      type: "Diagnostic",
      title: l.testName || "Lab test",
      detail: l.reportSummary || "Diagnostic booking recorded.",
      status: l.status,
    })),
    ...patientMedicines.map((o) => ({
      id: `med-${o.id}`,
      date: o.date,
      time: "",
      type: "Pharmacy",
      title: `Medicine order #${o.id}`,
      detail: o.items?.map((it) => it.name).join(", ") || "Medicine order recorded.",
      status: o.status,
    })),
  ].sort((a, b) => `${b.date || ""}${b.time || ""}`.localeCompare(`${a.date || ""}${a.time || ""}`));

  if (!patients.length) {
    return (
      <section className="panel">
        <Empty title="No patient records yet">
          Patients who have appointments with you will appear here. Medical history is visible only inside the doctor dashboard.
        </Empty>
      </section>
    );
  }

  return (
    <div className="doctor-records">
      <section className="panel records-selector">
        <div className="records-heading">
          <div>
            <h2>Patient Medical Records</h2>
            <p className="sub">Doctor-only access to the medical history of patients who have appointments with you.</p>
          </div>
          <span className="doctor-only-badge">🔒 Doctor access only</span>
        </div>

        <div className="patient-record-list">
          {patients.map((p) => (
            <button
              key={p.id}
              className={`patient-record-item ${selected?.id === p.id ? "selected" : ""}`}
              onClick={() => setSelectedId(p.id)}
            >
              <Avatar name={p.name} />
              <span>
                <strong>{p.name}</strong>
                <small>{p.age || "Age not recorded"} • {p.gender || "Gender not recorded"}</small>
              </span>
              <b>{doctorAppointments.filter((a) => a.patientId === p.id).length}</b>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <>
          <section className="panel patient-record-summary">
            <div className="record-patient-title">
              <Avatar name={selected.name} />
              <div>
                <h2>{selected.name}</h2>
                <p className="sub">Patient ID: {selected.id}</p>
              </div>
              <span className="doctor-only-badge">Clinical record</span>
            </div>

            <div className="record-info-grid">
              <div><span>Age / Gender</span><strong>{selected.age || "—"} / {selected.gender || "—"}</strong></div>
              <div><span>Blood Group</span><strong className="blood-tag">{selected.bloodGroup || "—"}</strong></div>
              <div><span>Phone</span><strong>{selected.phone || "—"}</strong></div>
              <div><span>Allergies</span><strong className={selected.allergies && selected.allergies !== "None" ? "danger-text" : ""}>{selected.allergies || "None recorded"}</strong></div>
              <div><span>Emergency Contact</span><strong>{selected.emergencyContact || "—"}</strong></div>
              <div><span>Total Visits</span><strong>{patientAppointments.length}</strong></div>
            </div>
          </section>

          <div className="records-chart-grid">
            <Panel title="Consultation history" cls="chart-panel">
              <Bars
                labels={visitsByMonth.map((x) => x.l)}
                series={[{ l: "Completed visits", v: visitsByMonth.map((x) => x.v) }]}
              />
              <p className="chart-note">Completed consultations by month.</p>
            </Panel>

            <Panel title="Reasons for visit" cls="chart-panel">
              {reasons.length ? (
                <Donut label="Visits" data={reasons} />
              ) : (
                <Empty title="No visit reasons recorded">Reason data will appear after an appointment is booked.</Empty>
              )}
            </Panel>
          </div>

          <section className="panel">
            <div className="ph">
              <div>
                <h2>Medical History Timeline</h2>
                <p className="sub">Appointments, diagnostics and pharmacy activity linked to this patient.</p>
              </div>
              <span className="doctor-only-badge">Private clinical view</span>
            </div>

            {!history.length ? (
              <Empty title="No medical history recorded">
                This patient's clinical activity will appear here as it is recorded.
              </Empty>
            ) : (
              <div className="medical-history-timeline">
                {history.map((item) => (
                  <div className="medical-history-entry" key={item.id}>
                    <div className="history-dot" />
                    <div className="history-entry-main">
                      <div className="history-entry-top">
                        <div>
                          <span className="history-type">{item.type}</span>
                          <strong>{item.title}</strong>
                        </div>
                        <Badge status={item.status || "recorded"} />
                      </div>
                      <div className="sub">{item.date || "Date not recorded"} {item.time ? `• ${item.time}` : ""}</div>
                      <div className="history-detail">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
