import { useState } from "react";
import { useHashTab } from "../../utils/useHashTab";
import { useApp } from "../../context/AppContext";
import { today } from "../../utils/queue";
import TokenCard from "../../components/TokenCard";
import { PatientHome } from "../Homes";
import FindDoctor from "./FindDoctor";
import MyAppointments from "./MyAppointments";
import Assistant from "./Assistant";
import PatientProfile from "./PatientProfile";
import BuyMedicines from "./BuyMedicines";
import LabTests from "./LabTests";
import MyHealthQR from "./MyHealthQR";

export default function PatientDashboard() {
  const { user, appointments } = useApp();
  const [tab, setTab] = useHashTab("patient", ["home", "book", "mine", "healthqr", "profile", "medicines", "lab", "ask"], "home");
  const [prefill, setPrefill] = useState(null);
  const mine = appointments.filter((a) => a.patientId === user.id && a.status !== "cancelled");
  const active = mine.find((a) => a.date === today() && (a.status === "waiting" || a.status === "in-consult"));

  const tabs = [
    ["home", "🏠 Dashboard"],
    ["book", "📅 Book Appointment"],
    ["mine", `🎫 My Appointments (${mine.length})`],
    ["healthqr", "📱 My Health QR"],
    ["profile", "👤 Patient Profile"],
    ["medicines", "💊 Buy Medicines"],
    ["lab", "🔬 Lab Tests"],
    ["ask", "🤖 Assistant"],
  ];

  return (
    <>
      {active && <TokenCard a={active} />}
      <nav className="tabs">
        {tabs.map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </nav>

      {tab === "home" && <PatientHome go={setTab} />}
      {tab === "book" && (
        <FindDoctor
          key={prefill?.urgency || "book"}
          prefill={prefill}
          onBooked={() => {
            setPrefill(null);
            setTab("mine");
          }}
        />
      )}
      {tab === "mine" && <MyAppointments list={mine} />}
      {tab === "healthqr" && <MyHealthQR />}
      {tab === "profile" && <PatientProfile onNavigate={(targetTab) => setTab(targetTab)} />}
      {tab === "medicines" && <BuyMedicines />}
      {tab === "lab" && <LabTests />}
      {tab === "ask" && (
        <Assistant
          onContinue={(p) => {
            setPrefill(p);
            setTab("book");
          }}
        />
      )}
    </>
  );
}
