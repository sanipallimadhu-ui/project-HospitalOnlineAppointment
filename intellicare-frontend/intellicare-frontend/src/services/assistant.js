// Mock urgency classifier. Replace with: fetch("/api/assistant/classify", { method: "POST", ... })
// It only classifies and routes. It never diagnoses.
const URGENT = ["chest pain", "breathing", "unconscious", "bleeding", "stroke", "seizure", "faint"];
const DEPTS = [
  [/child|baby|vaccin|infant/, "pediatric"],
  [/heart|chest|palpitation|ecg|blood pressure/, "cardio"],
  [/skin|rash|acne/, "derma"],
  [/bone|joint|fracture|knee/, "ortho"],
];

export async function classify(text, doctors) {
  const t = text.toLowerCase();
  const urgent = URGENT.some((k) => t.includes(k));
  const key = (DEPTS.find(([re]) => re.test(t)) || [null, "general"])[1];
  const doctor = doctors.find((d) => d.dept.toLowerCase().includes(key)) || null;
  return {
    urgency: urgent ? "urgent" : "normal",
    doctor,
    message: urgent
      ? "This may need quick attention. Please go to the emergency desk or call the hospital now. Your request has been marked urgent."
      : "This looks like a routine visit. Pick a time to book.",
  };
}
