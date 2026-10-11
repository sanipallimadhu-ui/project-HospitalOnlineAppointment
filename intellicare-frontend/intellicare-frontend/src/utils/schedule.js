export const minutesOf = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fmt = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

// Time slots generated from the doctor's working hours (morning + evening) and slot length.
export const makeSlots = (d) => {
  const mStart = d.morningStart || d.start || "09:00";
  const mEnd = d.morningEnd || (d.end && minutesOf(d.end) <= 840 ? d.end : "13:00");
  const eStart = d.eveningStart || (d.end && minutesOf(d.end) > 840 && minutesOf(d.start) >= 720 ? d.start : "17:00");
  const eEnd = d.eveningEnd || (d.end && minutesOf(d.end) > 840 ? d.end : "21:00");
  const slotMin = d.slotMin || 15;

  const out = [];
  for (let t = minutesOf(mStart); t + slotMin <= minutesOf(mEnd); t += slotMin) out.push(fmt(t));
  for (let t = minutesOf(eStart); t + slotMin <= minutesOf(eEnd); t += slotMin) out.push(fmt(t));
  return out;
};

export const splitSlotsByPeriod = (slots) => {
  const morning = [];
  const evening = [];
  slots.forEach((s) => {
    if (minutesOf(s) < 13 * 60) morning.push(s);
    else evening.push(s);
  });
  return { morning, evening };
};

export const formatDocHours = (d) => {
  const mStart = d.morningStart || d.start || "09:00";
  const mEnd = d.morningEnd || (d.end && minutesOf(d.end) <= 840 ? d.end : "13:00");
  const eStart = d.eveningStart || (d.end && minutesOf(d.end) > 840 && minutesOf(d.start) >= 720 ? d.start : "17:00");
  const eEnd = d.eveningEnd || (d.end && minutesOf(d.end) > 840 ? d.end : "21:00");
  return `Morning: ${mStart} - ${mEnd} • Evening: ${eStart} - ${eEnd}`;
};
export const nowMinutes = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };

import { today } from "./queue";

// Free slots for a doctor on a date (hides booked slots and, for today, times already passed).
export const freeSlots = (doc, date, appointments) => {
  const taken = appointments
    .filter((a) => a.doctorId === doc.id && a.date === date && !["cancelled", "no-show"].includes(a.status))
    .map((a) => a.time);
  return makeSlots(doc).filter((s) => !taken.includes(s) && (date !== today() || minutesOf(s) >= nowMinutes()));
};
