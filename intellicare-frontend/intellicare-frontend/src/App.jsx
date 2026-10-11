import { AppProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import Toast from "./components/Toast";
import Welcome from "./components/Welcome";
import Login from "./pages/Login";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import "./styles/app.css";

const PAGES = {
  patient: PatientDashboard,
  doctor: DoctorDashboard,
  admin: AdminDashboard,
  receptionist: ReceptionistDashboard,
};

function Router() {
  const { user } = useApp();
  if (!user) return <Login />;
  const Page = PAGES[user.role] || PatientDashboard; // role-based access: each role only gets its own page
  return (
    <div className="shell" data-role={user.role}>
      <Header />
      <main>
        <Welcome />{/* hides itself on non-home sidebar pages */}
        <Page />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="ic"><Router /><Toast /></div>
    </AppProvider>
  );
}
