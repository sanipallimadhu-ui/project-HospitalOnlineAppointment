import { useApp } from "../context/AppContext";
import { useIsHomePage } from "../utils/useHashTab";

const TAG = {
  patient: "Take care of your health. We're here for you.",
  doctor: "Here's your overview for today. Keep up the great work!",
  receptionist: "Manage patients, appointments and queue efficiently.",
  admin: "Here's an overview of your hospital system.",
};
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

export default function Welcome() {
  const { user } = useApp();
  const isHome = useIsHomePage(user.role);
  if (!isHome) return null;
  return (
    <section className="welcome">
      <div><h1>{greet()}, {user.name.split(" ")[0]} 👋</h1><p>{TAG[user.role]}</p></div>
      <div className="welcome-art" aria-hidden="true"><span>🩺</span><em>Healthy today,<br />brighter tomorrow</em></div>
    </section>
  );
}
