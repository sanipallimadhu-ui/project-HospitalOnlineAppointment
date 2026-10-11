import { useApp } from "../../context/AppContext";
import Empty from "../../components/Empty";
import { PageHead } from "./helpers";

export default function DoctorNotifications({ doctor }) {
  const { notifications, markNotificationsRead } = useApp();
  const mine = (notifications || []).filter((n) => !n.doctorId || n.doctorId === doctor.id);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <section className="panel">
      <PageHead title={`Notifications (${mine.length})`} sub="Alerts for new appointments, check-ins and queue activity.">
        {unread > 0 && <button className="ghost" onClick={() => markNotificationsRead(doctor.id)}>✓ Mark all as read</button>}
      </PageHead>
      {!mine.length ? <Empty title="No notifications yet">Activity updates and patient bookings will appear here.</Empty> : mine.map((n) => (
        <div className={`row notif-item ${!n.read ? "unread" : ""}`} key={n.id}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><strong>{n.title}</strong>{!n.read && <span className="unread-dot" />}</div>
            <div className="sub" style={{ marginTop: 2 }}>{n.message}</div>
            <small style={{ color: "var(--muted)", fontSize: 11 }}>{n.date} at {n.time}</small>
          </div>
          <div className="acts"><span className={`badge ${n.type === "urgent" ? "urgent" : "mint"}`}>{n.type || "Update"}</span></div>
        </div>
      ))}
    </section>
  );
}
