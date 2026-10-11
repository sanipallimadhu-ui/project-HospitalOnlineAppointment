import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateHistoryQRText } from "../utils/qrHistory";
import { useApp } from "../context/AppContext";

export default function TokenQRModal({ appointment, onClose }) {
  const { user, doctors, appointments, medicineOrders, labBookings } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState("qr"); // 'qr' | 'preview'

  if (!appointment) return null;

  const doc = doctors.find((d) => d.id === appointment.doctorId);
  const qrText = generateHistoryQRText({
    appointment,
    user,
    appointments,
    doctors,
    medicineOrders,
    labBookings,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(qrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Health QR & Token Pass</h3>
            <p className="sub">Token: <strong>{appointment.token}</strong> • {doc?.name || "Doctor"}</p>
          </div>
          <button className="ghost close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="seg" style={{ margin: "14px 0" }}>
          <button className={activeView === "qr" ? "on" : ""} onClick={() => setActiveView("qr")}>
            📱 Health QR Code
          </button>
          <button className={activeView === "preview" ? "on" : ""} onClick={() => setActiveView("preview")}>
            📄 Scanned Data ({qrText.length} chars)
          </button>
        </div>

        {activeView === "qr" ? (
          <div className="qr-container">
            <div className="qr-box">
              <QRCodeSVG
                value={qrText}
                size={220}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="qr-info">
              <strong>Scan with any phone camera or QR scanner</strong>
              <p className="sub">
                Encodes Patient ID, Name, Age/Gender, Blood Group, Token, Doctor, Allergies & Emergency Contact.
              </p>
              <small style={{ color: "var(--teal)", display: "block", marginTop: 4 }}>
                🛡️ Sensitive clinical records are protected and access-controlled.
              </small>
            </div>
          </div>
        ) : (
          <div className="qr-preview-box">
            <pre className="qr-preview-text">{qrText}</pre>
          </div>
        )}

        <div className="modal-actions">
          <button className="ghost" onClick={handleCopy}>
            {copied ? "✓ Copied Scanned Data" : "📋 Copy Scanned Data"}
          </button>
          <button className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
