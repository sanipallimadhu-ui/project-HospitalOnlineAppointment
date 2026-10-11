import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "../../context/AppContext";
import { today } from "../../utils/queue";
import { generateHealthQRText } from "../../utils/qrHistory";

export default function MyHealthQR() {
  const { user, appointments, doctors } = useApp();
  const [copied, setCopied] = useState(false);

  // Find active appointment for today or upcoming
  const myAppts = appointments.filter((a) => a.patientId === user?.id && a.status !== "cancelled");
  const activeAppt = myAppts.find((a) => a.date === today() && ["waiting", "in-consult"].includes(a.status)) || myAppts[myAppts.length - 1] || null;
  const doc = doctors.find((d) => d.id === activeAppt?.doctorId);

  const qrText = generateHealthQRText({
    appointment: activeAppt,
    user,
    doctors,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(qrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <section className="hero" style={{ background: "linear-gradient(110deg,#072e3b,#0a5c63 65%,#12a594)" }}>
        <h1>My Health QR Pass</h1>
        <p>Your secure hospital identity pass for fast check-in, token tracking, and emergency identification.</p>
      </section>

      <div className="health-qr-layout">
        {/* Physical-style Health ID Card */}
        <div className="health-card">
          <div className="health-card-header">
            <div className="health-brand">
              <span className="health-logo-icon">➕</span>
              <div>
                <strong>IntelliCare Health ID</strong>
                <small style={{ display: "block", opacity: 0.85, fontSize: 11 }}>Official Patient Pass</small>
              </div>
            </div>
            <span className="verified-badge">✓ Verified</span>
          </div>

          <div className="health-card-body">
            <div className="health-qr-box">
              <QRCodeSVG value={qrText} size={180} level="M" includeMargin={true} />
              <small className="qr-scan-hint">Scan at Reception / Clinic</small>
            </div>

            <div className="health-card-fields">
              <div className="h-field">
                <span className="h-lbl">Patient Name</span>
                <strong>{user?.name || "Patient"}</strong>
              </div>
              <div className="h-field">
                <span className="h-lbl">Patient ID</span>
                <code>{user?.id || "N/A"}</code>
              </div>
              <div className="h-grid-2">
                <div className="h-field">
                  <span className="h-lbl">Age / Gender</span>
                  <span>{user?.age || "28 yrs"} / {user?.gender || "Female"}</span>
                </div>
                <div className="h-field">
                  <span className="h-lbl">Blood Group</span>
                  <span className="blood-tag">{user?.bloodGroup || "O+"}</span>
                </div>
              </div>
              <div className="h-field">
                <span className="h-lbl">Current Token</span>
                {activeAppt ? (
                  <span className="tk" style={{ fontSize: 15, padding: "2px 10px" }}>
                    {activeAppt.token} ({activeAppt.time})
                  </span>
                ) : (
                  <span className="sub">No active token today</span>
                )}
              </div>
              <div className="h-field">
                <span className="h-lbl">Doctor / Department</span>
                <span>{doc ? `${doc.name} (${doc.dept})` : "General Outpatient"}</span>
              </div>
            </div>
          </div>

          <div className="health-card-footer">
            <div>
              <span className="h-lbl">Known Allergies</span>
              <span style={{ color: user?.allergies && user.allergies !== "None" ? "var(--red)" : "inherit", fontWeight: 600 }}>
                {user?.allergies || "None reported"}
              </span>
            </div>
            <div>
              <span className="h-lbl">Emergency Contact</span>
              <span>{user?.emergencyContact || user?.phone || "+91 98765 11223"}</span>
            </div>
          </div>
        </div>

        {/* Info & Data Transparency Panel */}
        <div className="panel" style={{ flex: 1 }}>
          <h2>Health QR Data & Privacy</h2>
          <p className="sub">
            The QR code contains only essential identification and appointment verification data to protect your personal privacy.
          </p>

          <div className="privacy-alert">
            <span>🛡️</span>
            <div>
              <strong>Privacy Protection Notice</strong>
              <p style={{ margin: "2px 0 0", fontSize: 13 }}>
                Sensitive clinical data (detailed diagnostic history, prescriptions, and lab findings) are strictly access-controlled and <strong>never stored directly inside the QR code</strong>.
              </p>
            </div>
          </div>

          <h3 style={{ fontSize: 16, marginTop: 18, marginBottom: 8 }}>Included in this QR:</h3>
          <ul className="qr-fields-list">
            <li><strong>Patient ID & Name:</strong> <code>{user?.id}</code> — {user?.name}</li>
            <li><strong>Age & Gender:</strong> {user?.age || "28 yrs"} • {user?.gender || "Female"}</li>
            <li><strong>Blood Group:</strong> {user?.bloodGroup || "O+"}</li>
            <li><strong>Token & Appointment:</strong> {activeAppt ? `${activeAppt.token} on ${activeAppt.date} at ${activeAppt.time}` : "None active"}</li>
            <li><strong>Doctor & Dept:</strong> {doc ? `${doc.name} (${doc.dept})` : "N/A"}</li>
            <li><strong>Allergies:</strong> {user?.allergies || "None"}</li>
            <li><strong>Emergency Contact:</strong> {user?.emergencyContact || user?.phone || "+91 98765 11223"}</li>
          </ul>

          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <button className="primary" onClick={handlePrint}>
              🖨️ Print Health Pass
            </button>
            <button className="ghost" onClick={handleCopy}>
              {copied ? "✓ Copied QR Data" : "📋 Copy Scanned Data"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
