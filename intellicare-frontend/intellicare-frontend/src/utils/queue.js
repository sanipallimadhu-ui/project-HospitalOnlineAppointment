export const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

// Waiting patients for one doctor on one day. Urgent first, then by booked time.
export const queueFor = (appts, doctorId, date = today()) =>
  appts
    .filter((a) => a.doctorId === doctorId && a.date === date && a.status === "waiting")
    .sort((a, b) => (a.priority === b.priority ? a.time.localeCompare(b.time) : a.priority === "urgent" ? -1 : 1));

export const positionOf = (appts, a) => queueFor(appts, a.doctorId, a.date).findIndex((x) => x.id === a.id);

// Estimated wait = people ahead (plus the one in the room) x doctor's average visit.
export const waitMinutes = (appts, a, doctor) => {
  const inRoom = appts.some((x) => x.doctorId === a.doctorId && x.date === a.date && x.status === "in-consult") ? 1 : 0;
  return Math.max(0, positionOf(appts, a) + inRoom) * doctor.avg;
};

// Placeholder no-show score from the patient's own history. Replace with your ML model.
export const riskFor = (appts, patientId) => {
  const past = appts.filter((a) => a.patientId === patientId && ["done", "no-show", "cancelled"].includes(a.status));
  const missed = past.filter((a) => a.status !== "done").length;
  return Math.min(0.9, 0.1 + (past.length ? (0.6 * missed) / past.length : 0));
};
export const riskLabel = (r) => (r >= 0.6 ? "High" : r >= 0.35 ? "Medium" : "Low");
