export default function Badge({ status, priority }) {
  const isUrgent = priority === "urgent";

  const map = {
    "waiting": { label: "Waiting", cls: "waiting" },
    "in-consult": { label: "In Progress", cls: "in-progress" },
    "in-progress": { label: "In Progress", cls: "in-progress" },
    "done": { label: "Completed", cls: "completed" },
    "completed": { label: "Completed", cls: "completed" },
    "cancelled": { label: "Cancelled", cls: "cancelled" },
    "no-show": { label: "No Show", cls: "no-show" },
  };

  const item = map[status] || { label: status, cls: status };
  const label = isUrgent && status === "waiting" ? "Urgent Waiting" : isUrgent && status !== "urgent" ? `${item.label} (Urgent)` : item.label;
  const cls = isUrgent ? "urgent" : item.cls;

  return <span className={`badge ${cls}`}>{label}</span>;
}
