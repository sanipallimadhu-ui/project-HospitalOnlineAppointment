import { useState } from "react";
import { useApp } from "../../context/AppContext";
import DoctorFields from "../../components/DoctorFields";

export default function ScheduleSettings({ doctor }) {
  const { updateDoctor } = useApp();
  const [v, setV] = useState({
    dept: doctor.dept,
    morningStart: doctor.morningStart || doctor.start || "09:00",
    morningEnd: doctor.morningEnd || (doctor.end && doctor.end <= "13:00" ? doctor.end : "13:00"),
    eveningStart: doctor.eveningStart || "17:00",
    eveningEnd: doctor.eveningEnd || "21:00",
    slotMin: doctor.slotMin || 15,
    avg: doctor.avg || 10,
  });
  return (
    <section className="panel">
      <h2>My schedule (Morning & Evening)</h2>
      <p className="sub">Patients can book slots in both morning and evening shifts.</p>
      <DoctorFields value={v} onChange={setV} />
      <button className="primary" style={{ marginTop: 14 }} onClick={() => updateDoctor(doctor.id, v)}>Save schedule</button>
    </section>
  );
}
