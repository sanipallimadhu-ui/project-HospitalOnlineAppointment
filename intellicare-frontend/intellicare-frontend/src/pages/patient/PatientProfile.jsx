import { useState } from "react";
import { useApp } from "../../context/AppContext";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import TokenQRModal from "../../components/TokenQRModal";
import { QRCodeSVG } from "qrcode.react";
import { generateHistoryQRText } from "../../utils/qrHistory";

export default function PatientProfile({ onNavigate }) {
  const { user, appointments, doctors, medicineOrders, labBookings, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [qrAppt, setQrAppt] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "+91 98765 43210",
    bloodGroup: user?.bloodGroup || "O+",
    age: user?.age || "28 yrs",
    gender: user?.gender || "Female",
    allergies: user?.allergies || "None",
    emergencyContact: user?.emergencyContact || "+91 98765 11223 (Family)",
    address: user?.address || "142 Hospital Road, Bangalore",
  });

  const patientAppointments = appointments.filter((a) => a.patientId === user?.id);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(form);
    setEditing(false);
  };

  return (
    <>
      {/* Patient Profile Card */}
      <section className="panel profile-hero">
        <div className="profile-header-wrap">
          <div className="profile-avatar-block">
            <Avatar name={user?.name || "Patient"} />
            <div>
              <h2>{user?.name}</h2>
              <div className="sub">{user?.email} • Patient ID: <code>{user?.id}</code></div>
              <div className="tags-row" style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge">🩸 Blood: {user?.bloodGroup || "O+"}</span>
                <span className="badge">🎂 Age/Gender: {user?.age || "28 yrs"} / {user?.gender || "Female"}</span>
                <span className="badge">⚠️ Allergies: {user?.allergies || "None"}</span>
              </div>
            </div>
          </div>
          <button className="ghost" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "✏️ Edit Profile"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <div className="grid2">
              <label>Full Name
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>Contact Phone
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>Blood Group
                <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </label>
              <div className="grid2">
                <label>Age
                  <input required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 30 yrs" />
                </label>
                <label>Gender
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>
              <label>Known Allergies
                <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Penicillin, Pollen, None" />
              </label>
              <label>Emergency Contact
                <input required value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="+91 98765 11223" />
              </label>
              <label style={{ gridColumn: "span 2" }}>Residential Address
                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
            </div>
            <button type="submit" className="primary" style={{ marginTop: 14 }}>
              Save Profile Changes
            </button>
          </form>
        ) : (
          <div className="profile-details-grid" style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div><span className="sub">Phone:</span> <strong>{user?.phone || "+91 98765 43210"}</strong></div>
            <div><span className="sub">Emergency Contact:</span> <strong>{user?.emergencyContact || "+91 98765 11223"}</strong></div>
            <div><span className="sub">Address:</span> <strong>{user?.address || "142 Hospital Road, Bangalore"}</strong></div>
            <div><span className="sub">Allergies:</span> <strong style={{ color: user?.allergies && user.allergies !== "None" ? "var(--red)" : "inherit" }}>{user?.allergies || "None"}</strong></div>
          </div>
        )}
      </section>

      {/* Quick Action Navigation Cards */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", margin: "16px 0" }}>
        <div className="panel action-card" onClick={() => onNavigate("healthqr")} style={{ cursor: "pointer", borderLeft: "5px solid #0a5c63" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 4px" }}>📱 My Health QR</h3>
              <p className="sub" style={{ margin: 0 }}>Digital health pass for quick hospital reception check-in</p>
            </div>
            <button className="primary" style={{ padding: "8px 14px", fontSize: 13 }}>View QR →</button>
          </div>
        </div>

        <div className="panel action-card" onClick={() => onNavigate("medicines")} style={{ cursor: "pointer", borderLeft: "5px solid #12a594" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 4px" }}>💊 Buy Medicines</h3>
              <p className="sub" style={{ margin: 0 }}>Browse hospital pharmacy, order essentials & tracking</p>
            </div>
            <button className="primary" style={{ padding: "8px 14px", fontSize: 13 }}>Shop Now →</button>
          </div>
        </div>

        <div className="panel action-card" onClick={() => onNavigate("lab")} style={{ cursor: "pointer", borderLeft: "5px solid #0e93a8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 4px" }}>🔬 Diagnostic Lab Tests</h3>
              <p className="sub" style={{ margin: 0 }}>Book CBC, lipid, thyroid profiles with home collection</p>
            </div>
            <button className="primary" style={{ padding: "8px 14px", fontSize: 13 }}>Book Test →</button>
          </div>
        </div>
      </div>

      {/* Generated Tokens & QR Codes */}
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2>Tokens & QR Codes ({patientAppointments.length})</h2>
            <p className="sub">Every token includes a verified QR code encoding your full history.</p>
          </div>
          <button className="ghost" onClick={() => onNavigate("book")}>+ Book New Token</button>
        </div>

        {patientAppointments.length === 0 ? (
          <Empty title="No tokens generated yet">
            Book an appointment with any doctor to generate your medical token with scannable QR history.
          </Empty>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
            {patientAppointments.map((a) => {
              const doc = doctors.find((d) => d.id === a.doctorId);
              const qrText = generateHistoryQRText({
                appointment: a,
                user,
                appointments,
                doctors,
                medicineOrders,
                labBookings,
              });

              return (
                <div className="row token-history-row" key={a.id} style={{ alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    {/* QR Code thumbnail */}
                    <div
                      className="qr-card-thumb"
                      onClick={() => setQrAppt(a)}
                      title="Click to enlarge & scan QR code"
                      style={{ cursor: "pointer", padding: 6, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, display: "grid", placeItems: "center" }}
                    >
                      <QRCodeSVG value={qrText} size={56} level="M" />
                    </div>
                    <div>
                      <div>
                        <span className="tk">{a.token}</span>
                        <strong>{doc?.name || "Doctor"}</strong> ({doc?.dept || "General"})
                      </div>
                      <div className="sub">Date: {a.date} at {a.time}</div>
                      {a.reason && <div className="sub">{a.reason}</div>}
                    </div>
                  </div>

                  <div className="acts">
                    <Badge status={a.status} priority={a.priority} />
                    <button className="ghost" onClick={() => setQrAppt(a)} title="Scan or view encoded QR data">
                      📱 Scan QR History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {qrAppt && <TokenQRModal appointment={qrAppt} onClose={() => setQrAppt(null)} />}
    </>
  );
}
