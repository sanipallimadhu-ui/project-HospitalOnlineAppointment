import PaymentModal from "../../components/PaymentModal";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import Empty from "../../components/Empty";
import Badge from "../../components/Badge";

const LAB_CATALOG = [
  {
    id: "l1",
    name: "Complete Blood Count (CBC)",
    category: "Routine Blood",
    desc: "Measures RBC, WBC, Platelets, Hemoglobin, and detects infection or anemia.",
    sample: "Blood",
    fasting: "No fasting required",
    reportTime: "6 hours",
    price: 350,
  },
  {
    id: "l2",
    name: "Fasting Blood Sugar (FBS)",
    category: "Diabetes",
    desc: "Evaluates baseline blood glucose levels after 8-10 hours overnight fasting.",
    sample: "Blood",
    fasting: "8-10 hrs fasting required",
    reportTime: "4 hours",
    price: 150,
  },
  {
    id: "l3",
    name: "HbA1c (3-Month Average Glucose)",
    category: "Diabetes",
    desc: "Gold standard test monitoring average blood sugar control over past 90 days.",
    sample: "Blood",
    fasting: "No fasting required",
    reportTime: "8 hours",
    price: 450,
  },
  {
    id: "l4",
    name: "Lipid Profile (Full Heart Screen)",
    category: "Heart & Lipids",
    desc: "Measures Total Cholesterol, HDL, LDL, VLDL, and Triglycerides.",
    sample: "Blood",
    fasting: "10-12 hrs fasting required",
    reportTime: "12 hours",
    price: 650,
  },
  {
    id: "l5",
    name: "Thyroid Profile Total (T3, T4, TSH)",
    category: "Hormones",
    desc: "Screens for hyperthyroidism, hypothyroidism, and metabolic dysfunction.",
    sample: "Blood",
    fasting: "Morning sample preferred",
    reportTime: "12 hours",
    price: 500,
  },
  {
    id: "l6",
    name: "Liver Function Test (LFT)",
    category: "Organ Health",
    desc: "Assesses Bilirubin, SGOT, SGPT, Alkaline Phosphatase, and Albumin.",
    sample: "Blood",
    fasting: "No fasting required",
    reportTime: "12 hours",
    price: 750,
  },
  {
    id: "l7",
    name: "Kidney Function Test (KFT / RFT)",
    category: "Organ Health",
    desc: "Checks Serum Creatinine, Blood Urea Nitrogen (BUN), and Electrolytes.",
    sample: "Blood",
    fasting: "No fasting required",
    reportTime: "12 hours",
    price: 700,
  },
  {
    id: "l8",
    name: "Vitamin D3 & Vitamin B12 Combo",
    category: "Deficiency & Immunity",
    desc: "Essential assessment for bone health, fatigue, nerve wellness, and energy.",
    sample: "Blood",
    fasting: "No fasting required",
    reportTime: "24 hours",
    price: 990,
  },
];

const LAB_CATEGORIES = ["All", "Routine Blood", "Diabetes", "Heart & Lipids", "Hormones", "Organ Health", "Deficiency & Immunity"];

const nextDates = () => {
  const arr = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    arr.push({
      iso: d.toLocaleDateString("en-CA"),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return arr;
};

export default function LabTests() {
  const { user, labBookings, bookLabTest } = useApp();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("tests"); // 'tests' | 'my-tests'
  const [bookingTest, setBookingTest] = useState(null);

  // Booking Form State
  const dates = nextDates();
  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [selectedSlot, setSelectedSlot] = useState("Morning (07:00 AM - 10:00 AM)");
  const [collectionType, setCollectionType] = useState("Home Sample Collection");

  const myBookings = labBookings.filter((b) => b.patientId === user?.id);

  const filtered = LAB_CATALOG.filter((t) => {
    const matchesCat = cat === "All" || t.category === cat;
    const matchesQ = t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase());
    return matchesCat && matchesQ;
  });

  const [paying, setPaying] = useState(false);
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingTest) return;
    setPaying(true);
  };
  const confirmPaid = () => {
    setPaying(false);
    bookLabTest({
      testName: bookingTest.name,
      category: bookingTest.category,
      price: bookingTest.price,
      date: selectedDate,
      timeSlot: selectedSlot,
      type: collectionType,
    });
    setBookingTest(null);
    setActiveTab("my-tests");
  };

  return (
    <>
      {paying && bookingTest && <PaymentModal title={`${bookingTest.name} · ${selectedDate} ${selectedSlot}`} amount={bookingTest.price} items={[[bookingTest.name, bookingTest.price]]} onClose={() => setPaying(false)} onPaid={confirmPaid} />}
      <section className="hero" style={{ background: "linear-gradient(110deg,#1c334b,#14566d 65%,#0e93a8)" }}>
        <h1>Diagnostic Lab Tests & Health Checkups</h1>
        <p>Book accredited clinical tests with complimentary home sample collection or hospital walk-in.</p>
        <div className="search">
          <select aria-label="Test Category" value={cat} onChange={(e) => setCat(e.target.value)}>
            {LAB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            aria-label="Search lab tests"
            placeholder="Search test by name, condition, or organ..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      <div className="seg" style={{ marginBottom: 18 }}>
        <button className={activeTab === "tests" ? "on" : ""} onClick={() => setActiveTab("tests")}>
          🔬 Available Lab Tests ({filtered.length})
        </button>
        <button className={activeTab === "my-tests" ? "on" : ""} onClick={() => setActiveTab("my-tests")}>
          📋 My Booked Tests & Reports ({myBookings.length})
        </button>
      </div>

      {activeTab === "tests" && (
        <div className="dgrid">
          {filtered.map((t) => (
            <article className="dcard" key={t.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <span className="badge" style={{ fontSize: 11 }}>{t.category}</span>
                  <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>{t.name}</h3>
                  <p className="sub" style={{ fontSize: 13, margin: 0 }}>{t.desc}</p>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--deep)", flexShrink: 0 }}>
                  ₹{t.price}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", fontSize: 12, color: "var(--muted)" }}>
                <span>🩸 {t.sample}</span>
                <span>⏱️ Report in {t.reportTime}</span>
                <span>💡 {t.fasting}</span>
              </div>

              <button className="primary" style={{ width: "100%", marginTop: 14 }} onClick={() => setBookingTest(t)}>
                Book This Test
              </button>
            </article>
          ))}
        </div>
      )}

      {activeTab === "my-tests" && (
        <section className="panel">
          <h2>My Booked Lab Tests</h2>
          <p className="sub">Track test status and view completed laboratory reports.</p>
          {myBookings.length === 0 ? (
            <Empty title="No lab tests booked yet">
              Select a test from the diagnostic catalog to book your health screening.
            </Empty>
          ) : (
            myBookings.map((b) => (
              <div className="row" key={b.id}>
                <div>
                  <span className="tk">{b.id}</span>
                  <strong>{b.testName}</strong> • ₹{b.price}
                  <div className="sub">Scheduled: {b.date} • {b.timeSlot}</div>
                  <div className="sub">📍 Mode: {b.type}</div>
                  <div className="sub" style={{ color: "var(--teal)", marginTop: 2 }}>{b.reportSummary}</div>
                </div>
                <div className="acts">
                  <span className="badge in-consult">{b.status}</span>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Booking Modal */}
      {bookingTest && (
        <div className="modal-backdrop" onClick={() => setBookingTest(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Book {bookingTest.name}</h3>
                <p className="sub">Fee: <strong>₹{bookingTest.price}</strong> • Report turnaround: {bookingTest.reportTime}</p>
              </div>
              <button className="ghost close-btn" onClick={() => setBookingTest(null)}>✕</button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ marginTop: 16 }}>
              <label>
                Collection Preference
                <select value={collectionType} onChange={(e) => setCollectionType(e.target.value)}>
                  <option value="Home Sample Collection">🏠 Home Sample Collection (Free Phlebotomist Visit)</option>
                  <option value="Hospital Laboratory Walk-in">🏥 Hospital Diagnostic Center Walk-in</option>
                </select>
              </label>

              <label>
                Select Date
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                  {dates.map((d) => <option key={d.iso} value={d.iso}>{d.label} ({d.iso})</option>)}
                </select>
              </label>

              <label>
                Select Time Slot (Morning & Evening Available)
                <select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
                  <option value="Morning (07:00 AM - 10:00 AM)">🌅 Morning (07:00 AM - 10:00 AM) - Best for Fasting</option>
                  <option value="Morning (10:00 AM - 01:00 PM)">🌅 Morning (10:00 AM - 01:00 PM)</option>
                  <option value="Evening (04:00 PM - 07:00 PM)">🌆 Evening (04:00 PM - 07:00 PM)</option>
                </select>
              </label>

              <div className="modal-actions" style={{ marginTop: 22 }}>
                <button type="button" className="ghost" onClick={() => setBookingTest(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Confirm Booking • ₹{bookingTest.price}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
