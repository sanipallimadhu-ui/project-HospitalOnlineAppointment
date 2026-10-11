import { useApp } from "../../context/AppContext";
import ScheduleSettings from "./ScheduleSettings";
import { PageHead } from "./helpers";

export default function DoctorAvailability({ doctor }) {
  const { setDoctorAvailability } = useApp();
  const on = doctor.available !== false;
  return (
    <>
      <section className="panel">
        <PageHead title="Availability Status" sub="Toggle whether you are actively seeing patients right now." />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button className={`primary ${on ? "" : "ghost"}`} onClick={() => setDoctorAvailability(doctor.id, true)}>🟢 Available / On Duty</button>
          <button className={`ghost ${!on ? "danger" : ""}`} onClick={() => setDoctorAvailability(doctor.id, false)}>🟡 On Break / Away</button>
        </div>
      </section>
      <ScheduleSettings key={doctor.id} doctor={doctor} />
    </>
  );
}
