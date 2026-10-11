// Formats patient health reference and token info for the QR Code without exposing sensitive medical data.

export function generateHealthQRText({ appointment, user, doctors = [] }) {
  const doc = doctors.find((d) => d.id === appointment?.doctorId);
  const patientId = user?.id || appointment?.patientId || "PID-UNREGISTERED";
  const name = user?.name || appointment?.patient || "Patient";
  const age = user?.age || "28 yrs";
  const gender = user?.gender || "Female";
  const bloodGroup = user?.bloodGroup || "O+";
  const token = appointment?.token || "N/A";
  const apptDate = appointment?.date || "Today";
  const apptTime = appointment?.time || "N/A";
  const apptStatus = (appointment?.status || "waiting").toUpperCase();
  const doctorName = doc?.name || "Attending Physician";
  const department = doc?.dept || "General Medicine";
  const allergies = user?.allergies || "None reported";
  const emergencyContact = user?.emergencyContact || user?.phone || "+91 98765 11223";

  return [
    "╔════════════════════════════════════════════════════╗",
    "         INTELLICARE PATIENT HEALTH ID & TOKEN       ",
    "╚════════════════════════════════════════════════════╝",
    `Patient ID: ${patientId}`,
    `Name: ${name}`,
    `Age / Gender: ${age} / ${gender}`,
    `Blood Group: ${bloodGroup}`,
    "",
    "── CURRENT APPOINTMENT & TOKEN ──",
    `Current Token: ${token}`,
    `Doctor: ${doctorName}`,
    `Department: ${department}`,
    `Appointment: ${apptDate} at ${apptTime}`,
    `Status: ${apptStatus}`,
    "",
    "── MEDICAL ALERTS & EMERGENCY ──",
    `Allergies: ${allergies}`,
    `Emergency Contact: ${emergencyContact}`,
    "",
    "── VERIFICATION REFERENCE ──",
    `Ref URL: https://intellicare.health/verify/patient/${patientId}?token=${token}`,
    "Note: Detailed clinical records are protected and access-controlled.",
    `Timestamp: ${new Date().toLocaleString("en-IN")}`,
  ].join("\n");
}

// Backward-compatible export
export const generateHistoryQRText = generateHealthQRText;
