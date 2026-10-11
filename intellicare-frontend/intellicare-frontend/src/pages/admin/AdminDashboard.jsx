import { AdminHome } from "../Homes";
import { useState } from "react";
import { useHashTab } from "../../utils/useHashTab";
import { useApp } from "../../context/AppContext";
import { queueFor, riskFor, riskLabel, today } from "../../utils/queue";
import { formatDocHours } from "../../utils/schedule";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Empty from "../../components/Empty";
import Stat from "../../components/Stat";
import DoctorFields, { DEFAULT_DOCTOR } from "../../components/DoctorFields";

export default function AdminDashboard() {
  const {
    users,
    doctors,
    appointments,
    departments,
    auditLogs,
    addDoctor,
    updateDoctor,
    removeDoctor,
    toggleDoctorStatus,
    setDoctorAvailability,
    createUserByAdmin,
    updateUser,
    toggleUserStatus,
    addDepartment,
    updateDepartment,
    removeDepartment,
    cancel,
    reschedule,
  } = useApp();

  const [tab, setTab] = useHashTab("admin", ["overview", "doctors", "users", "appointments", "departments", "analytics", "security"], "overview");

  // Filter States
  const [apptDoctorFilter, setApptDoctorFilter] = useState("all");
  const [apptStatusFilter, setApptStatusFilter] = useState("all");
  const [apptDateFilter, setApptDateFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Modal / Form States
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [newDoctorForm, setNewDoctorForm] = useState({ name: "", email: "", ...DEFAULT_DOCTOR });

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    role: "receptionist",
    phone: "",
    department: "General Medicine",
  });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    head: "",
    description: "",
    rooms: "Rooms 101-105",
    schedule: "Mon-Sat 09:00 - 20:00",
  });

  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: today(), time: "10:00" });

  // KPI Calculations
  const patientsCount = users.filter((u) => u.role === "patient").length;
  const staffCount = users.filter((u) => u.role === "receptionist").length;
  const todayAppts = appointments.filter((a) => a.date === today());
  const completedAppts = appointments.filter((a) => a.status === "done" || a.status === "completed");
  const cancelledAppts = appointments.filter((a) => a.status === "cancelled");
  const noShowAppts = appointments.filter((a) => a.status === "no-show");
  const activeQueue = todayAppts.filter((a) => a.status === "waiting");
  const urgentAppts = appointments.filter((a) => a.priority === "urgent");
  const noShowRate = appointments.length ? Math.round((noShowAppts.length / appointments.length) * 100) : 0;
  const atRiskPatients = activeQueue.filter((a) => riskLabel(riskFor(appointments, a.patientId)) === "High");

  // Handlers
  const handleCreateDoctor = (e) => {
    e.preventDefault();
    const err = addDoctor(newDoctorForm);
    if (!err) {
      setShowAddDoctorModal(false);
      setNewDoctorForm({ name: "", email: "", ...DEFAULT_DOCTOR });
    }
  };

  const handleSaveEditDoctor = (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    updateDoctor(editingDoctor.id, editingDoctor);
    setEditingDoctor(null);
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    const err = createUserByAdmin(staffForm);
    if (!err) {
      setShowAddStaffModal(false);
      setStaffForm({ name: "", email: "", role: "receptionist", phone: "", department: "General Medicine" });
    }
  };

  const handleSaveDept = (e) => {
    e.preventDefault();
    if (editingDept) {
      updateDepartment(editingDept.id, deptForm);
      setEditingDept(null);
    } else {
      addDepartment(deptForm);
      setShowDeptModal(false);
    }
    setDeptForm({ name: "", head: "", description: "", rooms: "Rooms 101-105", schedule: "Mon-Sat 09:00 - 20:00" });
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!reschedulingAppt) return;
    reschedule(reschedulingAppt.id, rescheduleData.time, rescheduleData.date);
    setReschedulingAppt(null);
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesDoc = apptDoctorFilter === "all" || a.doctorId === apptDoctorFilter;
    const matchesStatus =
      apptStatusFilter === "all" ||
      (apptStatusFilter === "completed" && (a.status === "done" || a.status === "completed")) ||
      (apptStatusFilter === "in-progress" && (a.status === "in-consult" || a.status === "in-progress")) ||
      a.status === apptStatusFilter;
    const matchesDate = !apptDateFilter || a.date === apptDateFilter;
    return matchesDoc && matchesStatus && matchesDate;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const q = userSearch.toLowerCase();
    const matchesQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q));
    return matchesRole && matchesQ;
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((l) => {
    const q = auditSearch.toLowerCase();
    return !q || l.action.toLowerCase().includes(q) || l.user.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
  });

  return (
    <>
      {tab === "overview" && (
        <div className="hero" style={{ background: "linear-gradient(110deg,#0a2540,#134e5e 65%,#12a594)" }}>
          <h1>Hospital Administration Console</h1>
          <p>Comprehensive governance across doctors, staff, patients, departments, live queues, and AI analytics.</p>
        </div>
      )}

      {/* Main Tabs */}
      <nav className="tabs" style={{ marginBottom: 18 }}>
        {[
          ["overview", "📊 Dashboard Overview"],
          ["doctors", `👨‍⚕️ Doctors (${doctors.length})`],
          ["users", `👥 User Management (${users.length})`],
          ["appointments", `📅 Appointments (${appointments.length})`],
          ["departments", `🏥 Departments (${departments.length})`],
          ["analytics", "🤖 AI & Analytics"],
          ["security", "🔐 Security & Audit Logs"],
        ].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </nav>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {tab === "overview" && <AdminHome />}
      {false && (
        <>
          <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 18 }}>
            <Stat n={patientsCount} label="Total Patients" />
            <Stat n={doctors.length} label="Total Doctors" />
            <Stat n={todayAppts.length} label="Today's Appointments" />
            <Stat n={activeQueue.length} label="Current Live Queue" />
            <Stat n={completedAppts.length} label="Completed Visits" />
            <Stat n={cancelledAppts.length} label="Cancelled Visits" />
            <Stat n={`${noShowRate}%`} label="No-Show Rate" />
          </div>

          {/* Live Queue by Doctor */}
          <section className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2>Active Queue by Doctor</h2>
              <button className="primary" onClick={() => setTab("doctors")}>Manage Doctors</button>
            </div>
            {!doctors.length && <Empty title="No doctors configured">Add doctors to start queuing patients.</Empty>}
            {doctors.map((d) => {
              const q = queueFor(appointments, d.id);
              const current = todayAppts.find((a) => a.doctorId === d.id && (a.status === "in-consult" || a.status === "in-progress"));
              return (
                <div className="row" key={d.id}>
                  <div className="rl">
                    <Avatar name={d.name} />
                    <div>
                      <strong>{d.name}</strong>
                      <span className={`doc-status-badge ${d.available !== false ? "available" : "away"}`} style={{ marginLeft: 8 }}>
                        {d.available !== false ? "Available" : "Away"}
                      </span>
                      <div className="sub">{d.dept} • {formatDocHours(d)}</div>
                    </div>
                  </div>
                  <div className="acts">
                    {current && <span className="badge in-progress">Current: {current.token}</span>}
                    <span className="badge waiting">{q.length} in queue</span>
                    <span className="sub">Est. queue clear: ~{q.length * (d.avg || 10)} min</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* High-Risk No-Shows Prediction Preview */}
          <section className="panel">
            <h2>AI No-Show Predictions for Today</h2>
            <p className="sub">Machine-learning triage identifying appointments at high risk of absence based on patient historical behavior.</p>
            {!atRiskPatients.length ? (
              <Empty title="Queue risk optimal">No high-risk appointments detected in today's active queue.</Empty>
            ) : (
              atRiskPatients.map((a) => (
                <div className="row" key={a.id}>
                  <div className="rl">
                    <Avatar name={a.patient} />
                    <div>
                      <span className="tk">{a.token}</span>
                      <strong>{a.patient}</strong>
                      <div className="sub">{a.time} with {doctors.find((d) => d.id === a.doctorId)?.name}</div>
                    </div>
                  </div>
                  <div className="acts">
                    <span className="risk high">{Math.round(riskFor(appointments, a.patientId) * 100)}% High Risk</span>
                    <span className="sub">Recommend telephone confirmation</span>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {/* ================= TAB 2: DOCTORS ================= */}
      {tab === "doctors" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2>Doctor Management ({doctors.length})</h2>
              <p className="sub">Configure doctor shifts, departments, consultation timings, and active status.</p>
            </div>
            <button className="primary" onClick={() => setShowAddDoctorModal(true)}>+ Add New Doctor</button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {doctors.map((d) => (
              <div className="row" key={d.id} style={{ alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <Avatar name={d.name} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 17 }}>{d.name}</strong>
                      <span className={`doc-status-badge ${d.available !== false ? "available" : "away"}`}>
                        {d.available !== false ? "Available" : "On Break"}
                      </span>
                      {d.active === false && <span className="badge cancelled">Deactivated</span>}
                    </div>
                    <div className="sub" style={{ marginTop: 2 }}>
                      Department: <strong>{d.dept}</strong> • Slot: <strong>{d.slotMin || 15} min</strong> • Avg visit: <strong>{d.avg || 10} min</strong>
                    </div>
                    <div className="sub">
                      Timings: {formatDocHours(d)}
                    </div>
                  </div>
                </div>

                <div className="acts">
                  <button
                    className="ghost"
                    onClick={() => setDoctorAvailability(d.id, d.available === false)}
                  >
                    {d.available !== false ? "Set Away" : "Set Available"}
                  </button>
                  <button className="ghost" onClick={() => setEditingDoctor(d)}>
                    ✏️ Edit Schedule
                  </button>
                  <button
                    className={`ghost ${d.active === false ? "primary" : "danger"}`}
                    onClick={() => toggleDoctorStatus(d.id)}
                  >
                    {d.active === false ? "Activate" : "Deactivate"}
                  </button>
                  <button
                    className="ghost danger"
                    onClick={() => window.confirm(`Permanently remove ${d.name}?`) && removeDoctor(d.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= TAB 3: USERS & STAFF ================= */}
      {tab === "users" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <h2>User & Staff Management ({users.length})</h2>
              <p className="sub">Manage patients, receptionists, medical staff, and role assignments.</p>
            </div>
            <button className="primary" onClick={() => setShowAddStaffModal(true)}>+ Create Staff Account</button>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div className="seg" style={{ margin: 0 }}>
              {["all", "patient", "receptionist", "doctor", "admin"].map((r) => (
                <button key={r} className={userRoleFilter === r ? "on" : ""} onClick={() => setUserRoleFilter(r)}>
                  {r.toUpperCase()} ({r === "all" ? users.length : users.filter((u) => u.role === r).length})
                </button>
              ))}
            </div>
            <input
              placeholder="Search user by name, email, or phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, margin: 0 }}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filteredUsers.map((u) => (
              <div className="row" key={u.id}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{u.name}</strong>
                    <span className="badge" style={{ textTransform: "uppercase", fontSize: 11 }}>{u.role}</span>
                    {u.status === "deactivated" && <span className="badge cancelled">Deactivated</span>}
                  </div>
                  <div className="sub">
                    Email: {u.email} • Phone: {u.phone || "N/A"} • ID: <code>{u.id}</code>
                  </div>
                  {u.role === "patient" && (
                    <div className="sub">
                      Blood: {u.bloodGroup || "O+"} • Age/Gender: {u.age || "N/A"} / {u.gender || "N/A"} • Allergies: {u.allergies || "None"}
                    </div>
                  )}
                </div>

                <div className="acts">
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    style={{ width: "auto", margin: 0, padding: "5px 8px" }}
                  >
                    <option value="patient">Patient</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className={`ghost ${u.status === "deactivated" ? "primary" : "danger"}`}
                    onClick={() => toggleUserStatus(u.id)}
                  >
                    {u.status === "deactivated" ? "Activate" : "Deactivate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= TAB 4: APPOINTMENTS ================= */}
      {tab === "appointments" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <h2>Appointment Management ({appointments.length})</h2>
              <p className="sub">Filter, inspect, reschedule, or cancel hospital appointments.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={apptDoctorFilter} onChange={(e) => setApptDoctorFilter(e.target.value)} style={{ width: "auto" }}>
                <option value="all">All Doctors</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={apptStatusFilter} onChange={(e) => setApptStatusFilter(e.target.value)} style={{ width: "auto" }}>
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
              <input
                type="date"
                value={apptDateFilter}
                onChange={(e) => setApptDateFilter(e.target.value)}
                style={{ width: "auto" }}
              />
              {apptDateFilter && (
                <button className="ghost" onClick={() => setApptDateFilter("")}>Clear Date</button>
              )}
            </div>
          </div>

          {!filteredAppointments.length ? (
            <Empty title="No appointments found">Try changing the filters above.</Empty>
          ) : (
            filteredAppointments.map((a) => {
              const doc = doctors.find((d) => d.id === a.doctorId);
              return (
                <div className="row" key={a.id}>
                  <div>
                    <span className="tk">{a.token}</span>
                    <strong>{a.patient}</strong> with <strong>{doc?.name || "Doctor"}</strong> ({doc?.dept})
                    <div className="sub">
                      Date: <strong>{a.date}</strong> at <strong>{a.time}</strong> • Priority: {a.priority} • Payment: {a.paymentStatus || "Pending"}
                    </div>
                  </div>

                  <div className="acts">
                    <Badge status={a.status} priority={a.priority} />
                    {a.status === "waiting" && (
                      <button className="ghost" onClick={() => { setReschedulingAppt(a); setRescheduleData({ date: a.date, time: a.time }); }}>
                        Reschedule
                      </button>
                    )}
                    {a.status !== "cancelled" && a.status !== "completed" && a.status !== "done" && (
                      <button className="ghost danger" onClick={() => cancel(a.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ================= TAB 5: DEPARTMENTS ================= */}
      {tab === "departments" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2>Department Management ({departments.length})</h2>
              <p className="sub">Organize medical specializations, room allocations, and clinical hours.</p>
            </div>
            <button className="primary" onClick={() => { setEditingDept(null); setShowDeptModal(true); }}>
              + Add Department
            </button>
          </div>

          <div className="dgrid">
            {departments.map((dept) => {
              const assignedDocs = doctors.filter((d) => d.dept === dept.name);
              return (
                <article className="dcard" key={dept.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>{dept.name}</h3>
                      <div className="sub">{dept.description}</div>
                    </div>
                    <span className="badge" style={{ fontSize: 11 }}>{assignedDocs.length} Doctors</span>
                  </div>

                  <div style={{ margin: "10px 0", fontSize: 13 }}>
                    <div>📍 <strong>{dept.rooms}</strong></div>
                    <div>🕒 <strong>{dept.schedule}</strong></div>
                    <div>👨‍⚕️ Head: <strong>{dept.head}</strong></div>
                  </div>

                  <div style={{ marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                    <small className="sub">Assigned Doctors: </small>
                    <small>{assignedDocs.map((d) => d.name).join(", ") || "None assigned yet"}</small>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="ghost" onClick={() => { setEditingDept(dept); setDeptForm(dept); setShowDeptModal(true); }}>
                      Edit
                    </button>
                    <button className="ghost danger" onClick={() => removeDepartment(dept.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= TAB 6: AI & ANALYTICS ================= */}
      {tab === "analytics" && (
        <>
          <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 18 }}>
            <Stat n={`${Math.round(appointments.length ? ((completedAppts.length) / appointments.length) * 100 : 0)}%`} label="Visit Completion Rate" />
            <Stat n={`${noShowRate}%`} label="AI No-Show Rate" />
            <Stat n={urgentAppts.length} label="Urgent Triage Total" />
            <Stat n="~12 min" label="Avg Patient Wait" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <section className="panel">
              <h2>🤖 Predictive No-Show Analytics</h2>
              <p className="sub">Evaluates past missed visits, cancellation history, and lead-time factors to forecast no-show probability.</p>
              <div style={{ margin: "14px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>Low Risk (&lt; 20%)</span>
                  <strong>{appointments.length - atRiskPatients.length} Patients</strong>
                </div>
                <div style={{ height: 8, background: "#d6f0e6", borderRadius: 4, marginBottom: 12 }}>
                  <div style={{ width: "85%", height: "100%", background: "#12a594", borderRadius: 4 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>High Risk (&gt; 60%)</span>
                  <strong style={{ color: "var(--red)" }}>{atRiskPatients.length} Patients</strong>
                </div>
                <div style={{ height: 8, background: "var(--redbg)", borderRadius: 4 }}>
                  <div style={{ width: `${Math.min(100, atRiskPatients.length * 20)}%`, height: "100%", background: "var(--red)", borderRadius: 4 }} />
                </div>
              </div>
            </section>

            <section className="panel">
              <h2>⏱️ Waiting-Time Prediction Model</h2>
              <p className="sub">Estimates queue clearance based on doctor visit lengths, check-in timestamps, and urgent priorities.</p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <div className="row" style={{ padding: "8px 0" }}>
                  <div><strong>Morning Peak Hour:</strong><div className="sub">10:00 AM - 12:00 PM</div></div>
                  <span className="badge in-progress">High Volume</span>
                </div>
                <div className="row" style={{ padding: "8px 0" }}>
                  <div><strong>Evening Peak Hour:</strong><div className="sub">06:00 PM - 08:00 PM</div></div>
                  <span className="badge in-progress">Moderate Volume</span>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* ================= TAB 7: SECURITY & AUDIT LOGS ================= */}
      {tab === "security" && (
        <>
          <section className="panel">
            <h2>Role-Based Access Control (RBAC) Matrix</h2>
            <p className="sub">Permission policies differentiating Hospital Admin and Front Desk Receptionist.</p>
            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: 10 }}>Feature Permission</th>
                    <th style={{ padding: 10 }}>Admin Role</th>
                    <th style={{ padding: 10 }}>Receptionist Role</th>
                    <th style={{ padding: 10 }}>Doctor Role</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Add / Remove Doctors", "✅ Full Access", "❌ Denied", "❌ Denied"],
                    ["Manage Staff & Roles", "✅ Full Access", "❌ Denied", "❌ Denied"],
                    ["Manage Departments", "✅ Full Access", "❌ Denied", "❌ Denied"],
                    ["Register Patients", "✅ Full Access", "✅ Full Access", "❌ Denied"],
                    ["Generate / Scan Health QR", "✅ Full Access", "✅ Full Access", "✅ Scan Only"],
                    ["Book & Reschedule Visits", "✅ Full Access", "✅ Full Access", "❌ Denied"],
                    ["Manage Live Queue", "✅ Full Access", "✅ Full Access", "✅ Doctor Queue"],
                    ["Doctor Timings & Shifts", "✅ Full Edit", "👁️ View Only", "✅ Edit Own"],
                    ["Security & Audit Logs", "✅ Full Audit Access", "❌ Denied", "❌ Denied"],
                  ].map(([feat, adm, rec, doc]) => (
                    <tr key={feat} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px" }}><strong>{feat}</strong></td>
                      <td style={{ padding: "10px", color: adm.startsWith("✅") ? "#0b6b3a" : "inherit" }}>{adm}</td>
                      <td style={{ padding: "10px", color: rec.startsWith("✅") ? "#0b6b3a" : rec.startsWith("❌") ? "var(--red)" : "inherit" }}>{rec}</td>
                      <td style={{ padding: "10px" }}>{doc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2>System Activity & Audit Logs ({auditLogs.length})</h2>
                <p className="sub">Immutable timestamped logs of all administrative and queue operations.</p>
              </div>
              <input
                placeholder="Search audit logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: "auto", minWidth: 220, margin: 0 }}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {filteredLogs.map((log) => (
                <div className="row" key={log.id} style={{ padding: "10px 0" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="badge" style={{ fontSize: 11 }}>{log.action}</span>
                      <strong>{log.user}</strong> <small style={{ opacity: 0.7 }}>({log.role})</small>
                    </div>
                    <div className="sub" style={{ marginTop: 2 }}>{log.details}</div>
                  </div>
                  <small style={{ color: "var(--muted)", flexShrink: 0 }}>{log.date} at {log.timestamp}</small>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ================= MODALS ================= */}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="modal-backdrop" onClick={() => setShowAddDoctorModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Hospital Doctor</h3>
              <button className="ghost close-btn" onClick={() => setShowAddDoctorModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDoctor} style={{ marginTop: 14 }}>
              <div className="grid2">
                <label>Full Name
                  <input required value={newDoctorForm.name} onChange={(e) => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })} placeholder="Dr. First Last" />
                </label>
                <label>Login Email
                  <input required type="email" value={newDoctorForm.email} onChange={(e) => setNewDoctorForm({ ...newDoctorForm, email: e.target.value })} placeholder="doctor@hospital.org" />
                </label>
              </div>
              <DoctorFields value={newDoctorForm} onChange={setNewDoctorForm} />
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setShowAddDoctorModal(false)}>Cancel</button>
                <button type="submit" className="primary">Create Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="modal-backdrop" onClick={() => setEditingDoctor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Doctor Schedule & Department</h3>
              <button className="ghost close-btn" onClick={() => setEditingDoctor(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditDoctor} style={{ marginTop: 14 }}>
              <label>Doctor Name
                <input required value={editingDoctor.name} onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })} />
              </label>
              <DoctorFields value={editingDoctor} onChange={setEditingDoctor} />
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setEditingDoctor(null)}>Cancel</button>
                <button type="submit" className="primary">Save Doctor Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showAddStaffModal && (
        <div className="modal-backdrop" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Staff Account</h3>
              <button className="ghost close-btn" onClick={() => setShowAddStaffModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStaff} style={{ marginTop: 14 }}>
              <label>Full Name
                <input required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="Staff member name" />
              </label>
              <label>Email (Sign in credential)
                <input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="staff@hospital.org" />
              </label>
              <div className="grid2">
                <label>Staff Role
                  <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                    <option value="receptionist">Receptionist / Front Desk</option>
                    <option value="admin">Hospital Administrator</option>
                  </select>
                </label>
                <label>Contact Phone
                  <input required value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder="+91 98765 00000" />
                </label>
              </div>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setShowAddStaffModal(false)}>Cancel</button>
                <button type="submit" className="primary">Create Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {showDeptModal && (
        <div className="modal-backdrop" onClick={() => setShowDeptModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDept ? "Edit Department" : "Add Department"}</h3>
              <button className="ghost close-btn" onClick={() => setShowDeptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveDept} style={{ marginTop: 14 }}>
              <label>Department Name
                <input required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="e.g. Neurology" />
              </label>
              <label>Head of Department (Physician)
                <input required value={deptForm.head} onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })} placeholder="e.g. Dr. Jane Smith" />
              </label>
              <label>Clinical Description
                <input required value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Specialized focus area" />
              </label>
              <div className="grid2">
                <label>Room Allocation
                  <input required value={deptForm.rooms} onChange={(e) => setDeptForm({ ...deptForm, rooms: e.target.value })} placeholder="Rooms 301-305" />
                </label>
                <label>Clinical Operating Hours
                  <input required value={deptForm.schedule} onChange={(e) => setDeptForm({ ...deptForm, schedule: e.target.value })} placeholder="Mon-Sat 09:00 - 21:00" />
                </label>
              </div>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="primary">{editingDept ? "Save Changes" : "Create Department"}</button>
              </div>
            </form>
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
              <label>New Time
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
    </>
  );
}
