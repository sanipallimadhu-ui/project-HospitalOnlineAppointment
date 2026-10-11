export const DEFAULT_DOCTOR = {
  dept: "",
  morningStart: "09:00",
  morningEnd: "13:00",
  eveningStart: "17:00",
  eveningEnd: "21:00",
  slotMin: 15,
  avg: 10,
};

export default function DoctorFields({ value, onChange }) {
  const v = {
    ...DEFAULT_DOCTOR,
    ...value,
    morningStart: value.morningStart || value.start || "09:00",
    morningEnd: value.morningEnd || (value.end && value.end <= "13:00" ? value.end : "13:00"),
    eveningStart: value.eveningStart || "17:00",
    eveningEnd: value.eveningEnd || "21:00",
  };
  const set = (k) => (e) => onChange({ ...v, [k]: e.target.type === "number" ? +e.target.value : e.target.value });

  return (
    <>
      <label>Department
        <input required value={v.dept} onChange={set("dept")} placeholder="For example: Cardiology" />
      </label>
      <div className="grid2">
        <label>🌅 Morning Shift Starts<input required type="time" value={v.morningStart} onChange={set("morningStart")} /></label>
        <label>🌅 Morning Shift Ends<input required type="time" value={v.morningEnd} onChange={set("morningEnd")} /></label>
        <label>🌆 Evening Shift Starts<input required type="time" value={v.eveningStart} onChange={set("eveningStart")} /></label>
        <label>🌆 Evening Shift Ends<input required type="time" value={v.eveningEnd} onChange={set("eveningEnd")} /></label>
        <label>Slot length (min)<input required type="number" min="5" step="5" value={v.slotMin} onChange={set("slotMin")} /></label>
        <label>Average visit (min)<input required type="number" min="1" value={v.avg} onChange={set("avg")} /></label>
      </div>
    </>
  );
}
