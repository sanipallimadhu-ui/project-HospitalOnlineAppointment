import TokenQRModal from "../../components/TokenQRModal";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  freeSlots,
  formatDocHours,
  splitSlotsByPeriod,
  minutesOf,
} from "../../utils/schedule";
import Avatar from "../../components/Avatar";
import Empty from "../../components/Empty";

const nextDays = (n = 7) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    return {
      iso: d.toLocaleDateString("en-CA"),
      wk:
        i === 0
          ? "Today"
          : d.toLocaleDateString("en-IN", { weekday: "short" }),
      num: d.getDate(),
      mon: d.toLocaleDateString("en-IN", { month: "short" }),
    };
  });

function PatientDetailsForm({ doc, date, time, prefill, onBack, onConfirm }) {
  const { user } = useApp();

  const [form, setForm] = useState({
    age: user?.age || "",
    gender: user?.gender || "",
    phone: user?.phone || "",
    email: user?.email || "",
    reason: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    emergencyContact: user?.emergencyContact || "",
  });

  const [error, setError] = useState("");

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const submit = () => {
    if (!form.age.trim()) {
      setError("Please enter your age.");
      return;
    }

    if (!form.gender.trim()) {
      setError("Please select your gender.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please enter the reason for your visit.");
      return;
    }

    if (!form.emergencyContact.trim()) {
      setError("Please enter an emergency contact.");
      return;
    }

    onConfirm({
      ...form,
      priority: prefill?.urgency || "normal",
    });
  };

  return (
    <section className="panel appointment-details">
      <div className="panel-head">
        <div>
          <h2>Patient & Appointment Details</h2>
          <p className="sub">
            Please provide accurate information before confirming your
            appointment.
          </p>
        </div>
      </div>

      <div className="booking-summary">
        <div>
          <strong>Doctor</strong>
          <span>{doc.name}</span>
        </div>

        <div>
          <strong>Department</strong>
          <span>{doc.dept}</span>
        </div>

        <div>
          <strong>Date</strong>
          <span>{date}</span>
        </div>

        <div>
          <strong>Time</strong>
          <span>{time}</span>
        </div>

        {prefill?.urgency === "urgent" && (
          <div>
            <strong>Priority</strong>
            <span className="urgent-text">Urgent</span>
          </div>
        )}
      </div>

      <h3 className="form-section-title">Personal Information</h3>

      <div className="form-grid">
        <div className="form-field">
          <label>Full Name</label>
          <input
            value={user?.name || ""}
            readOnly
            placeholder="Your full name"
          />
        </div>

        <div className="form-field">
          <label>Age *</label>
          <input
            type="number"
            min="1"
            max="120"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="Enter your age"
          />
        </div>

        <div className="form-field">
          <label>Gender *</label>
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">
              Prefer not to say
            </option>
          </select>
        </div>

        <div className="form-field">
          <label>Phone Number *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>

        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-field">
          <label>Emergency Contact *</label>
          <input
            type="text"
            value={form.emergencyContact}
            onChange={(e) =>
              update("emergencyContact", e.target.value)
            }
            placeholder="Name / phone number"
          />
        </div>
      </div>

      <h3 className="form-section-title">Medical Information</h3>

      <div className="form-grid">
        <div className="form-field full">
          <label>Reason for Visit *</label>
          <textarea
            rows="3"
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            placeholder="Example: Fever for 2 days, chest pain, routine check-up..."
          />
        </div>

        <div className="form-field full">
          <label>Past Medical History</label>
          <textarea
            rows="4"
            value={form.medicalHistory}
            onChange={(e) =>
              update("medicalHistory", e.target.value)
            }
            placeholder="Mention previous illnesses, surgeries, diabetes, hypertension, etc. If none, enter 'None'."
          />
        </div>

        <div className="form-field">
          <label>Allergies</label>
          <textarea
            rows="3"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            placeholder="Medicine/food/environmental allergies. Enter 'None' if not applicable."
          />
        </div>

        <div className="form-field">
          <label>Current Medications</label>
          <textarea
            rows="3"
            value={form.currentMedications}
            onChange={(e) =>
              update("currentMedications", e.target.value)
            }
            placeholder="List medicines you currently take. Enter 'None' if not applicable."
          />
        </div>
      </div>

      {prefill?.urgency === "urgent" && (
        <div className="alert" style={{ marginTop: 18 }}>
          ⚠️ This appointment has been marked as <strong>urgent</strong>.
          The doctor queue will prioritize it.
        </div>
      )}

      {error && (
        <div
          className="alert"
          style={{
            marginTop: 16,
            background: "#fff1f2",
            color: "#b42318",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 22,
          justifyContent: "flex-end",
        }}
      >
        <button className="secondary" onClick={onBack}>
          ← Back
        </button>

        <button className="primary book" onClick={submit}>
          Confirm Appointment
        </button>
      </div>
    </section>
  );
}

function DoctorCard({ doc, prefill, onBooked }) {
  const { appointments, book } = useApp();

  const [done, setDone] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const days = useMemo(() => nextDays(), []);

  const [date, setDate] = useState(days[0].iso);
  const [time, setTime] = useState("");

  const slots = freeSlots(doc, date, appointments);
  const { morning, evening } = splitSlotsByPeriod(slots);

  const handleConfirm = (patientData) => {
    const appointment = book({
      doctorId: doc.id,
      date,
      time,
      reason: patientData.reason,
      priority: patientData.priority,

      age: patientData.age,
      gender: patientData.gender,
      phone: patientData.phone,
      email: patientData.email,

      medicalHistory: patientData.medicalHistory,
      allergies: patientData.allergies,
      currentMedications: patientData.currentMedications,

      emergencyContact: patientData.emergencyContact,
    });

    setDone(appointment);
    setShowDetails(false);
  };

  if (showDetails) {
    return (
      <PatientDetailsForm
        doc={doc}
        date={date}
        time={time}
        prefill={prefill}
        onBack={() => setShowDetails(false)}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <article className="dcard">
      <div className="dtop">
        <Avatar name={doc.name} />

        <div>
          <h3>
            {doc.name}

            {prefill?.doctorId === doc.id && (
              <span className="tag">Suggested</span>
            )}
          </h3>

          <div className="sub">{doc.dept}</div>

          <div className="sub">
            {formatDocHours(doc)} • ~{doc.avg || 10} min per visit
          </div>
        </div>
      </div>

      <div className="lbl">Select Date</div>

      <div className="dates">
        {days.map((d) => {
          const n = freeSlots(doc, d.iso, appointments).length;

          return (
            <button
              key={d.iso}
              disabled={!n}
              className={`dt ${date === d.iso ? "on" : ""}`}
              onClick={() => {
                setDate(d.iso);
                setTime("");
              }}
            >
              <small>{d.wk}</small>
              <b>{d.num}</b>
              <small>{d.mon}</small>
              <small>{n ? `${n} slots` : "Full"}</small>
            </button>
          );
        })}
      </div>

      <div className="slots-section">
        <div
          className="lbl"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
          }}
        >
          <span>🌅 Morning Slots</span>
          <span
            className="badge"
            style={{ fontSize: 11, padding: "2px 7px" }}
          >
            {morning.length}
          </span>
        </div>

        {morning.length ? (
          <div className="chips">
            {morning.map((s) => (
              <button
                key={s}
                className={`chip ${time === s ? "on" : ""}`}
                onClick={() => setTime(s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p
            className="sub"
            style={{ fontSize: 13, margin: "4px 0" }}
          >
            No morning slots available on this date.
          </p>
        )}

        <div
          className="lbl"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 14,
          }}
        >
          <span>🌆 Evening Slots</span>

          <span
            className="badge"
            style={{ fontSize: 11, padding: "2px 7px" }}
          >
            {evening.length}
          </span>
        </div>

        {evening.length ? (
          <div className="chips">
            {evening.map((s) => (
              <button
                key={s}
                className={`chip ${time === s ? "on" : ""}`}
                onClick={() => setTime(s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p
            className="sub"
            style={{ fontSize: 13, margin: "4px 0" }}
          >
            No evening slots available on this date.
          </p>
        )}
      </div>

      {time && (
        <div style={{ marginTop: 16 }}>
          <button
            className="primary book"
            onClick={() => setShowDetails(true)}
          >
            Continue with Patient Details →
          </button>
        </div>
      )}

      {done && (
        <TokenQRModal
          appointment={done}
          onClose={() => {
            setDone(null);
            onBooked();
          }}
        />
      )}
    </article>
  );
}

export default function FindDoctor({ prefill, onBooked }) {
  const { doctors } = useApp();

  const [dept, setDept] = useState("");
  const [q, setQ] = useState("");

  const depts = [...new Set(doctors.map((d) => d.dept))];

  const list = doctors.filter(
    (d) =>
      (!dept || d.dept === dept) &&
      d.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <section className="hero">
        <h1>Book Doctor Appointment Online</h1>

        <p>
          Find a doctor, choose a date and time, provide your
          information, and get your token instantly.
        </p>

        <div className="search">
          <select
            aria-label="Speciality"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="">All specialities</option>

            {depts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <input
            aria-label="Search doctor"
            placeholder="Search doctor by name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      {prefill?.urgency === "urgent" && (
        <p className="alert" style={{ marginBottom: 14 }}>
          ⚠️ Your request is marked urgent and will be moved up
          the queue.
        </p>
      )}

      <h2 className="listh">
        Doctors ({list.length})
      </h2>

      {!doctors.length ? (
        <section className="panel">
          <Empty title="No doctors yet">
            A doctor or administrator needs to create a doctor
            account first.
          </Empty>
        </section>
      ) : list.length ? (
        <div className="dgrid">
          {list.map((d) => (
            <DoctorCard
              key={d.id}
              doc={d}
              prefill={prefill}
              onBooked={onBooked}
            />
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty title="No doctors match your search">
            Try another speciality or name.
          </Empty>
        </section>
      )}
    </>
  );
}