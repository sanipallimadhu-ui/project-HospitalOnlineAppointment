import { ReceptionHome } from "../Homes";
import { useState } from "react";
import { useHashTab } from "../../utils/useHashTab";
import { useApp } from "../../context/AppContext";
import { queueFor, today } from "../../utils/queue";
import { formatDocHours } from "../../utils/schedule";
import { generateHealthQRText } from "../../utils/qrHistory";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import Stat from "../../components/Stat";
import TokenQRModal from "../../components/TokenQRModal";
import { QRCodeSVG } from "qrcode.react";

export default function ReceptionistDashboard() {
  const {
    users,
    doctors,
    appointments,
    register,
    updateUser,
    book,
    walkInBooking,
    markPatientArrived,
    bumpQueuePriority,
    updatePaymentStatus,
    cancel,
    reschedule,
    noShow,
    callNext,
  } = useApp();

  const [activeTab, setActiveTab] = useHashTab("reception", ["home", "queue", "walkin", "patients", "appointments", "doctors", "scan"], "home");

  // Queue Doctor Selector
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || "all");

  // Search & Filter States
  const [patientSearch, setPatientSearch] = useState("");
  const [apptSearch, setApptSearch] = useState("");
  const [apptStatusFilter, setApptStatusFilter] = useState("all");

  // Modal / Form States
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "30 yrs",
    gender: "Female",
    bloodGroup: "O+",
    allergies: "None",
    emergencyContact: "",
    address: "Local City",
    role: "patient",
  });

  const [editingPatient, setEditingPatient] = useState(null);

  // Walk-in Form State
  const [walkInForm, setWalkInForm] = useState({
    patientName: "",
    patientPhone: "",
    doctorId: doctors[0]?.id || "",
    priority: "normal",
    paymentStatus: "Paid (Cash)",
  });

  // Advance Booking Modal
  const [bookingPatient, setBookingPatient] = useState(null);
  const [bookData, setBookData] = useState({
    doctorId: doctors[0]?.id || "",
    date: today(),
    time: "10:00",
    priority: "normal",
    paymentStatus: "Pending",
  });

  // Reschedule Modal
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: today(), time: "10:00" });

  // Print Token Slip Modal
  const [printSlipAppt, setPrintSlipAppt] = useState(null);

  // QR Modal
  const [qrAppt, setQrAppt] = useState(null);

  // QR Scanner Simulator State
  const [scannedText, setScannedText] = useState("");
  const [scanResult, setScanResult] = useState(null);

  // Computed Values
  const todayAppts = appointments.filter((a) => a.date === today());
  const todayWaiting = todayAppts.filter((a) => a.status === "waiting");
  const todayCheckedIn = todayAppts.filter((a) => a.checkedIn);
  const todayCompleted = todayAppts.filter((a) => a.status === "done" || a.status === "completed");

  const patientsList = users.filter((u) => u.role === "patient");

  // Handlers
  const handleRegisterPatient = (e) => {
    e.preventDefault();
    const err = register(regForm);
    if (!err) {
      setShowRegModal(false);
      setRegForm({
        name: "",
        email: "",
        phone: "",
        age: "30 yrs",
        gender: "Female",
        bloodGroup: "O+",
        allergies: "None",
        emergencyContact: "",
        address: "Local City",
        role: "patient",
      });
    }
  };

  const handleSaveEditPatient = (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    updateUser(editingPatient.id, editingPatient);
    setEditingPatient(null);
  };

  const handleWalkInSubmit = (e) => {
    e.preventDefault();
    if (!walkInForm.patientName || !walkInForm.doctorId) return;
    const newAppt = walkInBooking(walkInForm);
    setWalkInForm({
      patientName: "",
      patientPhone: "",
      doctorId: doctors[0]?.id || "",
      priority: "normal",
      paymentStatus: "Paid (Cash)",
    });
    setPrintSlipAppt(newAppt);
    setActiveTab("queue");
  };

  const handleAdvanceBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingPatient) return;
    const newAppt = book({
      doctorId: bookData.doctorId,
      date: bookData.date,
      time: bookData.time,
      priority: bookData.priority,
      patientId: bookingPatient.id,
      patientName: bookingPatient.name,
      paymentStatus: bookData.paymentStatus,
    });
    setBookingPatient(null);
    setPrintSlipAppt(newAppt);
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!reschedulingAppt) return;
    reschedule(reschedulingAppt.id, rescheduleData.time, rescheduleData.date);
    setReschedulingAppt(null);
  };

  // QR Scanner Simulation & Parsing
  const handleSimulateScan = (text) => {
    setScannedText(text);
    // Parse patient ID and Token
    const idMatch = text.match(/Patient ID:\s*([^\n\r]+)/i);
    const tokenMatch = text.match(/Current Token:\s*([^\n\r]+)/i) || text.match(/Token:\s*([^\n\r]+)/i);

    const foundPatient = idMatch ? users.find((u) => u.id === idMatch[1].trim()) : null;
    const foundAppt = tokenMatch ? appointments.find((a) => a.token === tokenMatch[1].trim()) : null;

    setScanResult({
      raw: text,
      patient: foundPatient,
      appointment: foundAppt,
      patientId: idMatch ? idMatch[1].trim() : "Unknown",
      token: tokenMatch ? tokenMatch[1].trim() : "N/A",
    });
  };

  // Queue to Display
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const queueList = currentDoctor
    ? queueFor(appointments, currentDoctor.id)
    : todayWaiting;

  // Filtered Patients List
  const filteredPatients = patientsList.filter((p) => {
    const q = patientSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.phone?.includes(q) || p.email?.toLowerCase().includes(q) || p.id.includes(q);
  });

  // Filtered Appointments List
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus =
      apptStatusFilter === "all" ||
      (apptStatusFilter === "completed" && (a.status === "done" || a.status === "completed")) ||
      (apptStatusFilter === "in-progress" && (a.status === "in-consult" || a.status === "in-progress")) ||
      a.status === apptStatusFilter;
    const q = apptSearch.toLowerCase();
    const matchesQ = !q || a.patient?.toLowerCase().includes(q) || a.token?.toLowerCase().includes(q);
    return matchesStatus && matchesQ;
  });

  return (
    <>
      {activeTab === "home" && (
        <>
      {/* Reception Header */}
      <section className="panel head" style={{ borderLeft: "5px solid #f47b20" }}>
        <div>
          <h2>Reception & Front Desk Operations</h2>
          <p className="sub">Manage patient registrations, walk-ins, digital tokens, live queue flow, and health passes.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={() => setActiveTab("walkin")}>
            🚶 + Walk-in Token
          </button>
          <button className="ghost" onClick={() => setShowRegModal(true)}>
            👤 + Register Patient
          </button>
        </div>
      </section>

      {/* KPI Stats Bar */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 18 }}>
        <Stat n={todayAppts.length} label="Today's Bookings" />
        <Stat n={todayWaiting.length} label="Waiting in Queue" />
        <Stat n={todayCheckedIn.length} label="Checked-In Patients" />
        <Stat n={todayCompleted.length} label="Completed Visits" />
        <Stat n={patientsList.length} label="Total Patients" />
      </div>

        </>
      )}

      {/* Navigation Tabs */}
      <nav className="tabs" style={{ marginBottom: 18 }}>
        {[
          ["home", "🏠 Dashboard"],
          ["queue", `🎫 Live Queue (${todayWaiting.length})`],
          ["walkin", "🚶 Walk-in Fast Booking"],
          ["patients", `👤 Patient Directory (${patientsList.length})`],
          ["appointments", `📅 All Appointments (${appointments.length})`],
          ["doctors", `👨‍⚕️ Doctor Schedules (${doctors.length})`],
          ["scan", "📷 Scan Health QR"],
        ].map(([k, l]) => (
          <button key={k} className={activeTab === k ? "on" : ""} onClick={() => setActiveTab(k)}>
            {l}
          </button>
        ))}
      </nav>
      {activeTab === "home" && <ReceptionHome go={setActiveTab} noStats />}

      {/* ================= TAB 1: QUEUE MANAGEMENT ================= */}
      {activeTab === "queue" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <h2>Live Hospital Queue</h2>
              <p className="sub">Track waiting patients, reorder urgent tokens, mark arrivals, and print slips.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sub">Filter by Doctor:</span>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ width: "auto", margin: 0 }}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.dept})
                  </option>
                ))}
              </select>
              {currentDoctor && (
                <button
                  className="primary"
                  onClick={() => callNext(currentDoctor.id)}
                  disabled={!queueList.length}
                  style={{ padding: "8px 16px" }}
                >
                  Call Next Patient
                </button>
              )}
            </div>
          </div>

          {currentDoctor && (
            <div className="sub" style={{ marginBottom: 14, background: "var(--mint)", padding: "8px 14px", borderRadius: 10 }}>
              👨‍⚕️ <strong>{currentDoctor.name}</strong> • {currentDoctor.dept} • {formatDocHours(currentDoctor)} • Status:{" "}
              <strong>{currentDoctor.available !== false ? "🟢 Available" : "🟡 On Break"}</strong>
            </div>
          )}

          {!queueList.length ? (
            <Empty title="Queue is currently clear">
              No patients are currently waiting for {currentDoctor ? currentDoctor.name : "this doctor"}.
            </Empty>
          ) : (
            queueList.map((a, i) => {
              const p = users.find((u) => u.id === a.patientId);
              const estWait = i * (currentDoctor?.avg || 10);

              return (
                <div className="row queue-row" key={a.id}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div className="queue-pos-badge">#{i + 1}</div>
                    <Avatar name={a.patient} urgent={a.priority === "urgent"} />
                    <div>
                      <div>
                        <span className="tk">{a.token}</span>
                        <strong>{a.patient}</strong>
                        {a.checkedIn ? (
                          <span className="verified-badge" style={{ marginLeft: 6, fontSize: 11 }}>
                            ✓ Arrived / Checked In
                          </span>
                        ) : (
                          <span className="badge cancelled" style={{ marginLeft: 6, fontSize: 11 }}>
                            Not Checked In
                          </span>
                        )}
                      </div>
                      <div className="sub" style={{ marginTop: 2 }}>
                        Scheduled: <strong>{a.time}</strong> • Est. Wait: <strong style={{ color: "var(--deep)" }}>~{estWait} min</strong> • Contact: {p?.phone || "N/A"}
                      </div>
                      <div className="sub">
                        Payment: <strong>{a.paymentStatus || "Pending"}</strong> • Blood: {p?.bloodGroup || "O+"} • Allergies: {p?.allergies || "None"}
                      </div>
                    </div>
                  </div>

                  <div className="acts">
                    <Badge status="waiting" priority={a.priority} />

                    {/* Priority Reordering */}
                    {a.priority !== "urgent" ? (
                      <button className="ghost" onClick={() => bumpQueuePriority(a.id, "urgent")} title="Move up queue as urgent">
                        ⬆️ Prioritize Urgent
                      </button>
                    ) : (
                      <button className="ghost" onClick={() => bumpQueuePriority(a.id, "normal")} title="Set back to normal">
                        ⬇️ Normal
                      </button>
                    )}

                    {/* Check-in Toggle */}
                    {!a.checkedIn && (
                      <button className="primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => markPatientArrived(a.id)}>
                        Mark Arrived
                      </button>
                    )}

                    {/* Payment Toggle */}
                    {a.paymentStatus !== "Paid" && (
                      <button className="ghost" onClick={() => updatePaymentStatus(a.id, "Paid (Cash)")}>
                        💵 Pay Cash
                      </button>
                    )}

                    {/* Print Slip */}
                    <button className="ghost" onClick={() => setPrintSlipAppt(a)} title="Print token slip">
                      🖨️ Slip
                    </button>

                    <button className="ghost qr-btn" onClick={() => setQrAppt(a)}>
                      📱 QR
                    </button>

                    <button className="ghost danger" onClick={() => noShow(a.id)}>
                      No-Show
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ================= TAB 2: WALK-IN BOOKING ================= */}
      {activeTab === "walkin" && (
        <section className="panel">
          <h2>Walk-In Patient Quick Token Generation</h2>
          <p className="sub">Register instant walk-in arrivals, allocate token, and add directly to today's live queue.</p>

          <form onSubmit={handleWalkInSubmit} style={{ maxWidth: 540, marginTop: 16 }}>
            <label>Patient Full Name
              <input required value={walkInForm.patientName} onChange={(e) => setWalkInForm({ ...walkInForm, patientName: e.target.value })} placeholder="Full name of patient" />
            </label>
            <label>Mobile Number
              <input required value={walkInForm.patientPhone} onChange={(e) => setWalkInForm({ ...walkInForm, patientPhone: e.target.value })} placeholder="+91 98765 00000" />
            </label>
            <label>Select Attending Doctor
              <select value={walkInForm.doctorId} onChange={(e) => setWalkInForm({ ...walkInForm, doctorId: e.target.value })}>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.dept} ({formatDocHours(d)})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid2">
              <label>Queue Triage Priority
                <select value={walkInForm.priority} onChange={(e) => setWalkInForm({ ...walkInForm, priority: e.target.value })}>
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">⚠️ Urgent (Move to Front of Queue)</option>
                </select>
              </label>
              <label>Consultation Payment
                <select value={walkInForm.paymentStatus} onChange={(e) => setWalkInForm({ ...walkInForm, paymentStatus: e.target.value })}>
                  <option value="Paid (Cash)">Paid (Cash - ₹200)</option>
                  <option value="Paid (UPI)">Paid (UPI / Online - ₹200)</option>
                  <option value="Pending">Payment Pending</option>
                </select>
              </label>
            </div>
            <button type="submit" className="primary" style={{ width: "100%", marginTop: 18 }}>
              Generate Walk-in Token & Print Slip
            </button>
          </form>
        </section>
      )}

      {/* ================= TAB 3: PATIENT MANAGEMENT ================= */}
      {activeTab === "patients" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <h2>Patient Directory ({patientsList.length})</h2>
              <p className="sub">Search patients, update details, book visits, and generate Health QR passes.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="Search patient by name, ID, phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ width: "auto", minWidth: 240, margin: 0 }}
              />
              <button className="primary" onClick={() => setShowRegModal(true)}>+ Register New Patient</button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filteredPatients.map((p) => {
              const activeAppt = appointments.find((a) => a.patientId === p.id && a.date === today() && a.status === "waiting");
              return (
                <div className="row" key={p.id}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 16 }}>{p.name}</strong>
                      <span className="sub">ID: <code>{p.id}</code></span>
                      {activeAppt && <span className="badge in-progress">Token: {activeAppt.token}</span>}
                    </div>
                    <div className="sub" style={{ marginTop: 2 }}>
                      Phone: <strong>{p.phone || "N/A"}</strong> • Age/Gender: {p.age || "N/A"} / {p.gender || "Female"} • Blood: <strong>{p.bloodGroup || "O+"}</strong>
                    </div>
                    <div className="sub">
                      Allergies: <span style={{ color: p.allergies && p.allergies !== "None" ? "var(--red)" : "inherit" }}>{p.allergies || "None"}</span> • Emergency: {p.emergencyContact || "N/A"}
                    </div>
                  </div>

                  <div className="acts">
                    <button className="primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => { setBookingPatient(p); setBookData({ ...bookData, doctorId: doctors[0]?.id || "" }); }}>
                      + Book Appointment
                    </button>
                    <button className="ghost" onClick={() => setEditingPatient(p)}>
                      ✏️ Edit
                    </button>
                    <button className="ghost qr-btn" onClick={() => setQrAppt(activeAppt || { patientId: p.id, patient: p.name, token: "HEALTH-ID" })}>
                      📱 Health QR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= TAB 4: APPOINTMENTS ================= */}
      {activeTab === "appointments" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <h2>All Hospital Appointments ({appointments.length})</h2>
              <p className="sub">Inspect appointment statuses, reschedule, manage payments, and print confirmation slips.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select value={apptStatusFilter} onChange={(e) => setApptStatusFilter(e.target.value)} style={{ width: "auto" }}>
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
              <input
                placeholder="Search patient or token..."
                value={apptSearch}
                onChange={(e) => setApptSearch(e.target.value)}
                style={{ width: "auto", margin: 0 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filteredAppointments.map((a) => {
              const doc = doctors.find((d) => d.id === a.doctorId);
              return (
                <div className="row" key={a.id}>
                  <div>
                    <span className="tk">{a.token}</span>
                    <strong>{a.patient}</strong> with <strong>{doc?.name || "Doctor"}</strong> ({doc?.dept})
                    <div className="sub" style={{ marginTop: 2 }}>
                      Date: <strong>{a.date}</strong> at <strong>{a.time}</strong> • Payment: <strong>{a.paymentStatus || "Pending"}</strong>
                    </div>
                  </div>

                  <div className="acts">
                    <Badge status={a.status} priority={a.priority} />
                    <button className="ghost" onClick={() => setPrintSlipAppt(a)}>
                      🖨️ Slip
                    </button>
                    {a.status === "waiting" && (
                      <button className="ghost" onClick={() => { setReschedulingAppt(a); setRescheduleData({ date: a.date, time: a.time }); }}>
                        Reschedule
                      </button>
                    )}
                    {a.status === "waiting" && (
                      <button className="ghost danger" onClick={() => cancel(a.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= TAB 5: DOCTOR SCHEDULES (VIEW ONLY) ================= */}
      {activeTab === "doctors" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2>Doctor Schedules & Roster (View Only)</h2>
              <p className="sub">Consultation hours and live duty status for patient enquiries.</p>
            </div>
            <span className="badge" style={{ fontSize: 12 }}>🔒 Reception Read-Only Access</span>
          </div>

          <div className="dgrid">
            {doctors.map((d) => {
              const q = queueFor(appointments, d.id);
              const current = todayAppts.find((a) => a.doctorId === d.id && (a.status === "in-consult" || a.status === "in-progress"));
              return (
                <article className="dcard" key={d.id}>
                  <div className="dtop">
                    <Avatar name={d.name} />
                    <div>
                      <h3 style={{ margin: 0 }}>{d.name}</h3>
                      <div className="sub">{d.dept}</div>
                      <span className={`doc-status-badge ${d.available !== false ? "available" : "away"}`} style={{ display: "inline-block", marginTop: 4 }}>
                        {d.available !== false ? "🟢 Available / On Duty" : "🟡 On Break / Away"}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 13 }}>
                    <div>🌅 <strong>Morning Shift:</strong> {d.morningStart || "09:00"} - {d.morningEnd || "13:00"}</div>
                    <div>🌆 <strong>Evening Shift:</strong> {d.eveningStart || "17:00"} - {d.eveningEnd || "21:00"}</div>
                    <div>⏱️ <strong>Visit Length:</strong> ~{d.avg || 10} min per patient</div>
                  </div>

                  <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                    <span>In Consultation: <strong>{current ? current.token : "None"}</strong></span>
                    <span>Queue: <strong>{q.length} waiting</strong></span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= TAB 6: SCAN HEALTH QR ================= */}
      {activeTab === "scan" && (
        <section className="panel">
          <h2>Scan Patient Health QR Pass</h2>
          <p className="sub">Fast lookup by barcode/QR scanner or manual token search to check in arriving patients.</p>

          <div style={{ maxWidth: 580, marginTop: 16 }}>
            <label>Scan or Paste Health QR Code Data
              <textarea
                rows={4}
                value={scannedText}
                onChange={(e) => handleSimulateScan(e.target.value)}
                placeholder="Scan QR code using hardware scanner or paste decoded text here..."
              />
            </label>

            {/* Quick Demo Scan Buttons */}
            <div style={{ marginTop: 8 }}>
              <small className="sub">Demo Quick Scan: </small>
              {todayAppts.slice(0, 3).map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className="ghost"
                  style={{ fontSize: 11, padding: "3px 8px", marginRight: 6 }}
                  onClick={() => handleSimulateScan(generateHealthQRText({ appointment: a, user: users.find((u) => u.id === a.patientId), doctors }))}
                >
                  Scan {a.token} ({a.patient})
                </button>
              ))}
            </div>

            {scanResult && (
              <div className="health-card" style={{ maxWidth: "100%", marginTop: 18 }}>
                <div className="health-card-header">
                  <strong>Decoded Health QR Pass</strong>
                  <span className="verified-badge">✓ Valid Pass</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, marginBottom: 14 }}>
                  <div><span className="h-lbl">Patient:</span> <strong>{scanResult.patient?.name || scanResult.appointment?.patient || "Patient"}</strong></div>
                  <div><span className="h-lbl">Patient ID:</span> <code>{scanResult.patientId}</code></div>
                  <div><span className="h-lbl">Token Number:</span> <span className="tk">{scanResult.token}</span></div>
                  <div><span className="h-lbl">Blood Group:</span> <span>{scanResult.patient?.bloodGroup || "O+"}</span></div>
                  <div><span className="h-lbl">Allergies:</span> <span>{scanResult.patient?.allergies || "None"}</span></div>
                  <div><span className="h-lbl">Emergency Contact:</span> <span>{scanResult.patient?.emergencyContact || "N/A"}</span></div>
                </div>

                {scanResult.appointment ? (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span>Status: <strong>{scanResult.appointment.status}</strong></span>
                      {scanResult.appointment.checkedIn && <small style={{ display: "block", color: "#5ff5a0" }}>Already Checked In</small>}
                    </div>
                    {!scanResult.appointment.checkedIn && (
                      <button
                        className="primary"
                        onClick={() => {
                          markPatientArrived(scanResult.appointment.id);
                          setScanResult({ ...scanResult, appointment: { ...scanResult.appointment, checkedIn: true } });
                        }}
                      >
                        ✓ Confirm Patient Arrival & Check In
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="sub" style={{ color: "#fff", opacity: 0.85, margin: 0 }}>
                    Patient profile verified. No appointment booked for today.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= MODALS ================= */}

      {/* Register Patient Modal */}
      {showRegModal && (
        <div className="modal-backdrop" onClick={() => setShowRegModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Patient</h3>
              <button className="ghost close-btn" onClick={() => setShowRegModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegisterPatient} style={{ marginTop: 14 }}>
              <div className="grid2">
                <label>Full Name
                  <input required value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} placeholder="Patient full name" />
                </label>
                <label>Mobile Phone
                  <input required value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} placeholder="+91 98765 00000" />
                </label>
                <label>Email Address
                  <input required type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} placeholder="patient@mail.com" />
                </label>
                <label>Blood Group
                  <select value={regForm.bloodGroup} onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </label>
                <label>Age
                  <input required value={regForm.age} onChange={(e) => setRegForm({ ...regForm, age: e.target.value })} placeholder="e.g. 28 yrs" />
                </label>
                <label>Gender
                  <select value={regForm.gender} onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>Known Allergies
                  <input value={regForm.allergies} onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })} placeholder="None or specific allergies" />
                </label>
                <label>Emergency Contact
                  <input required value={regForm.emergencyContact} onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })} placeholder="+91 98765 11223" />
                </label>
              </div>
              <label>Residential Address
                <input required value={regForm.address} onChange={(e) => setRegForm({ ...regForm, address: e.target.value })} />
              </label>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setShowRegModal(false)}>Cancel</button>
                <button type="submit" className="primary">Register Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="modal-backdrop" onClick={() => setEditingPatient(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Patient Details</h3>
              <button className="ghost close-btn" onClick={() => setEditingPatient(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditPatient} style={{ marginTop: 14 }}>
              <div className="grid2">
                <label>Full Name
                  <input required value={editingPatient.name} onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })} />
                </label>
                <label>Mobile Phone
                  <input required value={editingPatient.phone} onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })} />
                </label>
                <label>Age
                  <input required value={editingPatient.age} onChange={(e) => setEditingPatient({ ...editingPatient, age: e.target.value })} />
                </label>
                <label>Blood Group
                  <select value={editingPatient.bloodGroup} onChange={(e) => setEditingPatient({ ...editingPatient, bloodGroup: e.target.value })}>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </label>
                <label>Allergies
                  <input value={editingPatient.allergies} onChange={(e) => setEditingPatient({ ...editingPatient, allergies: e.target.value })} />
                </label>
                <label>Emergency Contact
                  <input required value={editingPatient.emergencyContact} onChange={(e) => setEditingPatient({ ...editingPatient, emergencyContact: e.target.value })} />
                </label>
              </div>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setEditingPatient(null)}>Cancel</button>
                <button type="submit" className="primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Booking Modal */}
      {bookingPatient && (
        <div className="modal-backdrop" onClick={() => setBookingPatient(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Appointment for {bookingPatient.name}</h3>
              <button className="ghost close-btn" onClick={() => setBookingPatient(null)}>✕</button>
            </div>
            <form onSubmit={handleAdvanceBookingSubmit} style={{ marginTop: 14 }}>
              <label>Doctor
                <select value={bookData.doctorId} onChange={(e) => setBookData({ ...bookData, doctorId: e.target.value })}>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.dept})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid2">
                <label>Date
                  <input required type="date" value={bookData.date} onChange={(e) => setBookData({ ...bookData, date: e.target.value })} />
                </label>
                <label>Time Slot
                  <input required type="time" value={bookData.time} onChange={(e) => setBookData({ ...bookData, time: e.target.value })} />
                </label>
                <label>Priority
                  <select value={bookData.priority} onChange={(e) => setBookData({ ...bookData, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label>Payment Status
                  <select value={bookData.paymentStatus} onChange={(e) => setBookData({ ...bookData, paymentStatus: e.target.value })}>
                    <option value="Paid (Cash)">Paid (Cash)</option>
                    <option value="Paid (UPI)">Paid (UPI)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setBookingPatient(null)}>Cancel</button>
                <button type="submit" className="primary">Confirm Booking & Generate Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Appointment & Token Slip Modal */}
      {printSlipAppt && (
        <div className="modal-backdrop" onClick={() => setPrintSlipAppt(null)}>
          <div className="modal-card print-slip-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="slip-content" id="printable-token-slip" style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ borderBottom: "2px dashed var(--line)", paddingBottom: 10, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>🏥 INTELLICARE HOSPITAL</h3>
                <small className="sub">Outpatient Consultation & Queue Token</small>
              </div>

              <div className="slip-token-big" style={{ fontSize: 48, fontWeight: 800, color: "var(--deep)", margin: "8px 0" }}>
                {printSlipAppt.token}
              </div>

              <div style={{ textAlign: "left", fontSize: 13, display: "grid", gap: 6, margin: "14px 0", background: "#f8fbfc", padding: 12, borderRadius: 10 }}>
                <div><strong>Patient:</strong> {printSlipAppt.patient}</div>
                <div><strong>Doctor:</strong> {doctors.find((d) => d.id === printSlipAppt.doctorId)?.name || "Doctor"}</div>
                <div><strong>Department:</strong> {doctors.find((d) => d.id === printSlipAppt.doctorId)?.dept || "OPD"}</div>
                <div><strong>Date & Time:</strong> {printSlipAppt.date} at {printSlipAppt.time}</div>
                <div><strong>Priority:</strong> <span style={{ textTransform: "uppercase" }}>{printSlipAppt.priority}</span></div>
                <div><strong>Payment:</strong> {printSlipAppt.paymentStatus || "Paid"}</div>
              </div>

              <div style={{ margin: "12px 0" }}>
                <QRCodeSVG
                  value={generateHealthQRText({ appointment: printSlipAppt, user: users.find((u) => u.id === printSlipAppt.patientId), doctors })}
                  size={120}
                  level="M"
                />
                <small className="sub" style={{ display: "block", marginTop: 4 }}>Scan for verified Health Pass</small>
              </div>

              <small style={{ color: "var(--muted)", display: "block", borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
                Please proceed to the waiting lounge. Watch the live display screen for your token call.
              </small>
            </div>

            <div className="modal-actions" style={{ marginTop: 14 }}>
              <button className="primary" onClick={() => window.print()}>
                🖨️ Print Slip
              </button>
              <button className="ghost" onClick={() => setPrintSlipAppt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="modal-backdrop" onClick={() => setReschedulingAppt(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button className="ghost close-btn" onClick={() => setReschedulingAppt(null)}>✕</button>
            </div>
            <form onSubmit={handleConfirmReschedule} style={{ marginTop: 14 }}>
              <p className="sub">
                Token: <strong>{reschedulingAppt.token}</strong> for Patient <strong>{reschedulingAppt.patient}</strong>
              </p>
              <label>New Date
                <input required type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
              </label>
              <label>New Time Slot
                <input required type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })} />
              </label>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setReschedulingAppt(null)}>Cancel</button>
                <button type="submit" className="primary">Confirm Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrAppt && <TokenQRModal appointment={qrAppt} onClose={() => setQrAppt(null)} />}
    </>
  );
}
