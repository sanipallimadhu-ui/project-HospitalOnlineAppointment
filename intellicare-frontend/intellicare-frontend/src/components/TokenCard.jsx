import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "../context/AppContext";
import { positionOf, waitMinutes } from "../utils/queue";
import { generateHistoryQRText } from "../utils/qrHistory";
import TokenQRModal from "./TokenQRModal";

export default function TokenCard({ a }) {
  const { user, appointments, doctors, medicineOrders, labBookings } = useApp();
  const [showQR, setShowQR] = useState(false);

  const doc = doctors.find((d) => d.id === a.doctorId);
  if (!doc) return null;
  const now = a.status === "in-consult";
  const ahead = positionOf(appointments, a);
  const filled = now ? 5 : Math.max(1, 5 - ahead);

  const qrText = generateHistoryQRText({
    appointment: a,
    user,
    appointments,
    doctors,
    medicineOrders,
    labBookings,
  });

  return (
    <>
      <section className={`token ${now ? "now" : ""}`}>
        <div className="stub">
          <div className="small">Your token</div>
          <div className="big">{a.token}</div>
          <div className="sub" style={{ color: "#fff", opacity: 0.85, fontSize: 12, marginTop: 4 }}>
            {a.date} • {a.time}
          </div>
        </div>

        <div className="meta">
          <strong>{now ? "You are with the doctor" : `${ahead} ${ahead === 1 ? "person" : "people"} ahead of you`}</strong>
          <span>{doc.name}, {doc.dept}</span>
          {!now && <span>Estimated wait: about {waitMinutes(appointments, a, doc)} min</span>}
          <div className="dots">{[0, 1, 2, 3, 4].map((i) => <b key={i} className={i < filled ? "f" : ""} />)}</div>
        </div>

        <div className="token-qr" onClick={() => setShowQR(true)} title="Click to view & scan QR Code">
          <div className="qr-thumb-wrap">
            <QRCodeSVG value={qrText} size={64} level="M" />
          </div>
          <button type="button" className="qr-view-btn" onClick={(e) => { e.stopPropagation(); setShowQR(true); }}>
            🔍 Scan History
          </button>
        </div>
      </section>

      {showQR && <TokenQRModal appointment={a} onClose={() => setShowQR(false)} />}
    </>
  );
}
