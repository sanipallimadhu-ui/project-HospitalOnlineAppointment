import { createContext, useContext, useEffect, useState } from "react";
import { load, save } from "../services/db";
import { queueFor, today } from "../utils/queue";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Live Queue Active",
    message:
      "Clinic queue opened for today. Check Live Queue to view waiting patients.",
    time: "09:00 AM",
    date: today(),
    read: false,
    type: "info",
  },
  {
    id: "notif-2",
    title: "Patient Check-in",
    message: "Patient checked in with verified My Health QR.",
    time: "09:15 AM",
    date: today(),
    read: false,
    type: "checkin",
  },
];

const DEFAULT_DEPARTMENTS = [
  {
    id: "dept-1",
    name: "Cardiology",
    head: "Dr. Sarah Jenkins",
    description:
      "Heart, coronary artery, and cardiovascular diagnostic care",
    rooms: "Rooms 101-104 (Wing A)",
    schedule: "Mon-Sat 09:00 - 21:00",
  },
  {
    id: "dept-2",
    name: "General Medicine",
    head: "Dr. Rajesh Sharma",
    description:
      "Primary healthcare, internal medicine, fever, and triage",
    rooms: "Rooms 201-205 (Wing B)",
    schedule: "Mon-Sun 08:00 - 22:00",
  },
  {
    id: "dept-3",
    name: "Pediatrics",
    head: "Dr. Ananya Roy",
    description:
      "Infant, child, vaccination, and adolescent healthcare",
    rooms: "Rooms 105-108 (Wing A)",
    schedule: "Mon-Sat 09:00 - 20:00",
  },
  {
    id: "dept-4",
    name: "Orthopedics",
    head: "Dr. Vikram Seth",
    description:
      "Bone fractures, joint disorders, and sports injuries",
    rooms: "Rooms 301-303 (Wing C)",
    schedule: "Mon-Fri 09:00 - 18:00",
  },
  {
    id: "dept-5",
    name: "Dermatology",
    head: "Dr. Priya Nair",
    description:
      "Skin diseases, allergies, and cosmetic dermatology",
    rooms: "Rooms 206-208 (Wing B)",
    schedule: "Mon-Sat 10:00 - 19:00",
  },
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: "log-1",
    timestamp: "09:00:15 AM",
    date: today(),
    user: "System Administrator",
    role: "admin",
    action: "System Initialization",
    details:
      "Hospital clinical database and queue subsystems loaded successfully.",
  },
  {
    id: "log-2",
    timestamp: "09:15:22 AM",
    date: today(),
    user: "Front Desk Reception",
    role: "receptionist",
    action: "Patient Check-in",
    details:
      "Verified patient Health QR and confirmed Token C-001 arrival.",
  },
];

const EMPTY = {
  users: [],
  doctors: [],
  appointments: [],
  medicineOrders: [],
  labBookings: [],
  departments: DEFAULT_DEPARTMENTS,
  notifications: DEFAULT_NOTIFICATIONS,
  auditLogs: DEFAULT_AUDIT_LOGS,
  sessionId: null,
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => {
    const d = load() || EMPTY;

    return {
      ...EMPTY,
      ...d,
      departments:
        d.departments && d.departments.length
          ? d.departments
          : DEFAULT_DEPARTMENTS,
      medicineOrders: d.medicineOrders || [],
      labBookings: d.labBookings || [],
      notifications:
        d.notifications && d.notifications.length
          ? d.notifications
          : DEFAULT_NOTIFICATIONS,
      auditLogs:
        d.auditLogs && d.auditLogs.length
          ? d.auditLogs
          : DEFAULT_AUDIT_LOGS,
    };
  });

  const [toast, setToast] = useState("");

  useEffect(() => {
    save(db);
  }, [db]);

  const say = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  const up = (fn) => setDb((d) => ({ ...d, ...fn(d) }));

  const patch = (id, ch) =>
    up((d) => ({
      appointments: d.appointments.map((a) =>
        a.id === id ? { ...a, ...ch } : a
      ),
    }));

  const user =
    db.users.find((u) => u.id === db.sessionId) || null;

  // ---------------------------------------------------------
  // AUDIT LOG
  // ---------------------------------------------------------

  const logAudit = (action, details) => {
    const log = {
      id: uid(),
      timestamp: new Date().toLocaleTimeString("en-IN"),
      date: today(),
      user: user?.name || "System",
      role: user?.role || "system",
      action,
      details,
    };

    up((d) => ({
      auditLogs: [log, ...(d.auditLogs || [])],
    }));
  };

  // ---------------------------------------------------------
  // CREATE USER
  // ---------------------------------------------------------

  const createUser = (data, signIn) => {
    const email = data.email.trim().toLowerCase();

    if (db.users.some((u) => u.email === email)) {
      return "An account with this email already exists.";
    }

    const id = uid();
    const role = data.role || "patient";
    const doctorId = role === "doctor" ? uid() : null;

    const morningStart =
      data.morningStart || data.start || "09:00";

    const morningEnd =
      data.morningEnd ||
      (data.end && data.end <= "13:00"
        ? data.end
        : "13:00");

    const eveningStart =
      data.eveningStart || "17:00";

    const eveningEnd =
      data.eveningEnd || "21:00";

    /*
     * IMPORTANT:
     * Removed fake patient information such as:
     * +91 98765 43210
     * O+
     * 28 yrs
     * Female
     * fake address
     *
     * We now store only information actually provided
     * by the user.
     */

    const newUser = {
      id,
      name: data.name.trim(),
      email,
      role,
      doctorId,

      phone: data.phone || "",
      bloodGroup: data.bloodGroup || "",
      age: data.age || "",
      gender: data.gender || "",
      allergies: data.allergies || "",
      currentMedications: data.currentMedications || "",
      medicalHistory: data.medicalHistory || "",
      emergencyContact: data.emergencyContact || "",
      address: data.address || "",

      status: "active",
      createdAt: today(),
    };

    up((d) => ({
      users: [...d.users, newUser],

      doctors: doctorId
        ? [
            ...d.doctors,
            {
              id: doctorId,
              name: data.name.trim(),
              dept:
                data.dept?.trim() ||
                "General Medicine",
              start: morningStart,
              end: eveningEnd,
              morningStart,
              morningEnd,
              eveningStart,
              eveningEnd,
              slotMin: data.slotMin || 15,
              avg: data.avg || 10,
              available: true,
              active: true,
            },
          ]
        : d.doctors,

      sessionId: signIn ? id : d.sessionId,
    }));

    logAudit(
      "User Registration",
      `Created account for ${newUser.name} with role ${role}`
    );

    return "";
  };

  const value = {
    user,

    users: db.users,
    doctors: db.doctors,
    appointments: db.appointments,

    departments:
      db.departments || DEFAULT_DEPARTMENTS,

    medicineOrders:
      db.medicineOrders || [],

    labBookings:
      db.labBookings || [],

    notifications:
      db.notifications || [],

    auditLogs:
      db.auditLogs || [],

    toast,
    logAudit,

    // -------------------------------------------------------
    // REGISTRATION
    // -------------------------------------------------------

    register: (data) => createUser(data, true),

    createUserByAdmin: (data) => {
      const err = createUser(data, false);

      if (!err) {
        say(
          `Staff account created for ${data.name}.`
        );
      }

      return err;
    },

    // -------------------------------------------------------
    // LOGIN
    // -------------------------------------------------------

    login: (email) => {
      const u = db.users.find(
        (x) =>
          x.email ===
          email.trim().toLowerCase()
      );

      if (!u) {
        return "No account found for this email. Create one first.";
      }

      if (u.status === "deactivated") {
        return "This account has been deactivated. Please contact an administrator.";
      }

      up(() => ({
        sessionId: u.id,
      }));

      logAudit(
        "User Login",
        `User ${u.name} logged in (${u.role})`
      );

      return "";
    },

    logout: () => {
      logAudit(
        "User Logout",
        `User ${user?.name || "Anonymous"} signed out`
      );

      up(() => ({
        sessionId: null,
      }));
    },

    // -------------------------------------------------------
    // USER MANAGEMENT
    // -------------------------------------------------------

    updateUser: (id, ch) => {
      up((d) => ({
        users: d.users.map((u) =>
          u.id === id
            ? { ...u, ...ch }
            : u
        ),
      }));

      logAudit(
        "User Updated",
        `Admin updated profile for user ID ${id}`
      );

      say("User details updated.");
    },

    toggleUserStatus: (id) => {
      up((d) => ({
        users: d.users.map((u) =>
          u.id === id
            ? {
                ...u,
                status:
                  u.status === "deactivated"
                    ? "active"
                    : "deactivated",
              }
            : u
        ),
      }));

      logAudit(
        "Status Changed",
        `Toggled account status for user ID ${id}`
      );

      say("User status updated.");
    },

    // -------------------------------------------------------
    // DOCTOR MANAGEMENT
    // -------------------------------------------------------

    addDoctor: (data) => {
      const e = createUser(
        { ...data, role: "doctor" },
        false
      );

      if (!e) {
        logAudit(
          "Doctor Added",
          `Admin created doctor profile for ${data.name}`
        );

        say("Doctor added successfully.");
      }

      return e;
    },

    updateDoctor: (id, ch) => {
      up((d) => ({
        doctors: d.doctors.map((x) =>
          x.id === id
            ? { ...x, ...ch }
            : x
        ),
      }));

      logAudit(
        "Doctor Updated",
        `Updated schedule/department for doctor ID ${id}`
      );

      say("Doctor details updated.");
    },

    toggleDoctorStatus: (id) => {
      up((d) => ({
        doctors: d.doctors.map((x) =>
          x.id === id
            ? {
                ...x,
                active:
                  x.active === false
                    ? true
                    : false,
              }
            : x
        ),
      }));

      logAudit(
        "Doctor Status Toggled",
        `Toggled activation status for doctor ID ${id}`
      );

      say("Doctor status toggled.");
    },

    removeDoctor: (id) => {
      const doc = db.doctors.find(
        (x) => x.id === id
      );

      up((d) => ({
        doctors: d.doctors.filter(
          (x) => x.id !== id
        ),

        users: d.users.filter(
          (u) => u.doctorId !== id
        ),

        appointments:
          d.appointments.filter(
            (a) => a.doctorId !== id
          ),
      }));

      logAudit(
        "Doctor Removed",
        `Removed ${
          doc?.name || "doctor"
        } and their appointments`
      );

      say("Doctor removed from hospital system.");
    },

    setDoctorAvailability: (
      id,
      available
    ) => {
      up((d) => ({
        doctors: d.doctors.map((x) =>
          x.id === id
            ? { ...x, available }
            : x
        ),
      }));

      logAudit(
        "Availability Change",
        `Doctor ${id} set to ${
          available
            ? "Available"
            : "On Break"
        }`
      );

      say(
        `Doctor status: ${
          available
            ? "🟢 Available / On Duty"
            : "🟡 On Break / Away"
        }`
      );
    },

    // -------------------------------------------------------
    // DEPARTMENT MANAGEMENT
    // -------------------------------------------------------

    addDepartment: (dept) => {
      const newDept = {
        ...dept,
        id: uid(),
      };

      up((d) => ({
        departments: [
          ...(d.departments || []),
          newDept,
        ],
      }));

      logAudit(
        "Department Added",
        `Created new hospital department: ${dept.name}`
      );

      say(
        `Department ${dept.name} created.`
      );
    },

    updateDepartment: (id, ch) => {
      up((d) => ({
        departments: (
          d.departments || []
        ).map((dept) =>
          dept.id === id
            ? { ...dept, ...ch }
            : dept
        ),
      }));

      logAudit(
        "Department Updated",
        `Modified department settings for ID ${id}`
      );

      say("Department updated.");
    },

    removeDepartment: (id) => {
      const dept = (
        db.departments || []
      ).find((x) => x.id === id);

      up((d) => ({
        departments: (
          d.departments || []
        ).filter((x) => x.id !== id),
      }));

      logAudit(
        "Department Removed",
        `Removed department: ${
          dept?.name || id
        }`
      );

      say("Department removed.");
    },

    // -------------------------------------------------------
    // APPOINTMENT BOOKING
    // -------------------------------------------------------

    book: ({
      doctorId,
      date,
      time,

      // Appointment details
      reason = "",
      priority = "normal",

      // Patient identification
      patientId,
      patientName,

      // Patient information
      age = "",
      gender = "",
      phone = "",
      email = "",

      // Medical information
      medicalHistory = "",
      allergies = "",
      currentMedications = "",

      // Emergency information
      emergencyContact = "",

      paymentStatus = "Pending",
    }) => {
      const targetUserId =
        patientId || user?.id;

      const targetUserName =
        patientName ||
        user?.name ||
        "Patient";

      const doc = db.doctors.find(
        (x) => x.id === doctorId
      );

      const n =
        db.appointments.filter(
          (a) =>
            a.doctorId === doctorId &&
            a.date === date
        ).length + 1;

      const token = `${
        doc
          ? doc.dept?.[0]?.toUpperCase() ||
            "T"
          : "T"
      }-${String(n).padStart(3, "0")}`;

      /*
       * Create appointment with the ACTUAL
       * information entered by the patient.
       */

      const newAppt = {
        id: uid(),

        patientId: targetUserId,
        patient: targetUserName,

        doctorId,

        date,
        time,

        token,

        status: "waiting",

        priority,

        reason: reason.trim(),

        // Patient details
        age: age?.toString().trim() || "",
        gender: gender?.trim() || "",
        phone: phone?.trim() || "",
        email:
          email?.trim() ||
          user?.email ||
          "",

        // Medical details
        medicalHistory:
          medicalHistory?.trim() || "",

        allergies:
          allergies?.trim() || "",

        currentMedications:
          currentMedications?.trim() || "",

        // Emergency details
        emergencyContact:
          emergencyContact?.trim() || "",

        checkedIn: false,

        paymentStatus,

        createdAt: today(),
      };

      const notif = {
        id: uid(),

        doctorId,

        title:
          priority === "urgent"
            ? "⚠️ Urgent Patient Booked"
            : "📅 New Appointment Booked",

        message: `Patient ${targetUserName} booked token ${token} for ${date} at ${time}. Priority: ${priority}.`,

        time: new Date().toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),

        date: today(),

        read: false,

        type:
          priority === "urgent"
            ? "urgent"
            : "booking",
      };

      /*
       * Save appointment.
       */
      up((d) => ({
        appointments: [
          ...d.appointments,
          newAppt,
        ],

        notifications: [
          notif,
          ...(d.notifications || []),
        ],
      }));

      /*
       * ALSO update the patient's profile.
       *
       * This means the information entered while
       * booking can later be displayed in:
       * - Patient Profile
       * - Doctor Dashboard
       * - Patient medical information
       */

      if (
        targetUserId &&
        targetUserId === user?.id
      ) {
        up((d) => ({
          users: d.users.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,

                  age:
                    age?.trim() ||
                    u.age ||
                    "",

                  gender:
                    gender?.trim() ||
                    u.gender ||
                    "",

                  phone:
                    phone?.trim() ||
                    u.phone ||
                    "",

                  email:
                    email?.trim() ||
                    u.email ||
                    "",

                  medicalHistory:
                    medicalHistory?.trim() ||
                    u.medicalHistory ||
                    "",

                  allergies:
                    allergies?.trim() ||
                    u.allergies ||
                    "",

                  currentMedications:
                    currentMedications?.trim() ||
                    u.currentMedications ||
                    "",

                  emergencyContact:
                    emergencyContact?.trim() ||
                    u.emergencyContact ||
                    "",
                }
              : u
          ),
        }));
      }

      logAudit(
        "Appointment Booked",
        `Token ${token} booked for ${targetUserName} with ${
          doc?.name || "Doctor"
        }`
      );

      say(
        `Booked successfully! Token is ${token}.`
      );

      return newAppt;
    },

    // -------------------------------------------------------
    // RECEPTIONIST WALK-IN BOOKING
    // -------------------------------------------------------

    walkInBooking: ({
      patientName,
      patientPhone,
      doctorId,
      priority = "normal",
      paymentStatus = "Paid (Cash)",
    }) => {
      let existing = db.users.find(
        (u) =>
          u.phone === patientPhone.trim() ||
          u.name.toLowerCase() ===
            patientName.toLowerCase().trim()
      );

      let pId = existing?.id;

      if (!pId) {
        pId = uid();

        const newPatient = {
          id: pId,
          name: patientName.trim(),

          email: `${patientName
            .toLowerCase()
            .replace(/\s+/g, "")}@patient.hospital`,

          phone: patientPhone.trim(),

          role: "patient",

          bloodGroup: "O+",
          age: "30 yrs",
          gender: "Not specified",

          allergies: "None",

          emergencyContact:
            patientPhone.trim(),

          address: "Walk-in patient",

          status: "active",

          createdAt: today(),
        };

        up((d) => ({
          users: [
            ...d.users,
            newPatient,
          ],
        }));
      }

      const doc = db.doctors.find(
        (x) => x.id === doctorId
      );

      const nowTime =
        new Date().toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

      const n =
        db.appointments.filter(
          (a) =>
            a.doctorId === doctorId &&
            a.date === today()
        ).length + 1;

      const token = `${
        doc
          ? doc.dept?.[0]?.toUpperCase() ||
            "W"
          : "W"
      }-${String(n).padStart(3, "0")}`;

      const newAppt = {
        id: uid(),

        patientId: pId,

        patient:
          patientName.trim(),

        doctorId,

        date: today(),

        time: nowTime,

        token,

        status: "waiting",

        priority,

        reason:
          "Walk-in registration",

        checkedIn: true,

        paymentStatus,

        createdAt: today(),
      };

      up((d) => ({
        appointments: [
          ...d.appointments,
          newAppt,
        ],
      }));

      logAudit(
        "Walk-in Registered",
        `Reception issued Token ${token} for walk-in patient ${patientName}`
      );

      say(
        `Walk-in Token ${token} generated for ${patientName}! Added to queue.`
      );

      return newAppt;
    },

    // -------------------------------------------------------
    // PATIENT ARRIVAL
    // -------------------------------------------------------

    markPatientArrived: (id) => {
      const appt =
        db.appointments.find(
          (a) => a.id === id
        );

      patch(id, {
        checkedIn: true,
        status: "waiting",
      });

      logAudit(
        "Patient Arrival",
        `Patient ${appt?.patient} (Token ${appt?.token}) marked as arrived at reception`
      );

      say(
        `Token ${
          appt?.token || ""
        } marked as Arrived.`
      );
    },

    // -------------------------------------------------------
    // QUEUE
    // -------------------------------------------------------

    bumpQueuePriority: (
      id,
      priority
    ) => {
      patch(id, { priority });

      logAudit(
        "Queue Reordered",
        `Priority set to ${priority} for appointment ${id}`
      );

      say(
        `Queue priority updated to ${priority}.`
      );
    },

    // -------------------------------------------------------
    // PAYMENT
    // -------------------------------------------------------

    updatePaymentStatus: (
      id,
      paymentStatus
    ) => {
      patch(id, { paymentStatus });

      logAudit(
        "Payment Updated",
        `Payment marked as ${paymentStatus} for appointment ${id}`
      );

      say("Payment status updated.");
    },

    // -------------------------------------------------------
    // CANCEL
    // -------------------------------------------------------

    cancel: (id) => {
      const appt =
        db.appointments.find(
          (a) => a.id === id
        );

      patch(id, {
        status: "cancelled",
      });

      logAudit(
        "Appointment Cancelled",
        `Cancelled Token ${
          appt?.token || id
        } for patient ${
          appt?.patient || ""
        }`
      );

      say("Appointment cancelled.");
    },

    // -------------------------------------------------------
    // RESCHEDULE
    // -------------------------------------------------------

    reschedule: (
      id,
      time,
      date
    ) => {
      const updateData = date
        ? { time, date }
        : { time };

      patch(id, updateData);

      logAudit(
        "Appointment Rescheduled",
        `Rescheduled appointment ${id} to ${time} (${
          date || "same day"
        })`
      );

      say(
        `Appointment moved to ${time}.`
      );
    },

    // -------------------------------------------------------
    // NO SHOW
    // -------------------------------------------------------

    noShow: (id) => {
      const appt =
        db.appointments.find(
          (a) => a.id === id
        );

      patch(id, {
        status: "no-show",
      });

      logAudit(
        "Marked No-Show",
        `Patient ${appt?.patient} (Token ${appt?.token}) marked as no-show`
      );

      say("Marked as no-show.");
    },

    // -------------------------------------------------------
    // COMPLETE APPOINTMENT
    // -------------------------------------------------------

    completeAppointment: (id) => {
      const appt =
        db.appointments.find(
          (a) => a.id === id
        );

      patch(id, {
        status: "completed",
      });

      logAudit(
        "Visit Completed",
        `Consultation completed for Token ${
          appt?.token || ""
        }`
      );

      say(
        "Patient consultation marked as completed."
      );
    },

    // -------------------------------------------------------
    // CALL PATIENT
    // -------------------------------------------------------

    callPatient: (id) => {
      const target =
        db.appointments.find(
          (a) => a.id === id
        );

      if (!target) return;

      up((d) => ({
        appointments: d.appointments.map(
          (a) => {
            if (
              a.doctorId ===
                target.doctorId &&
              a.date === today() &&
              a.status === "in-consult"
            ) {
              return {
                ...a,
                status: "completed",
              };
            }

            if (a.id === id) {
              return {
                ...a,
                status: "in-consult",
              };
            }

            return a;
          }
        ),
      }));

      logAudit(
        "Patient Called",
        `Called ${target.patient} (Token ${target.token}) into consultation room`
      );

      say(
        `Calling ${target.patient} (Token: ${target.token}).`
      );
    },

    // -------------------------------------------------------
    // CALL NEXT
    // -------------------------------------------------------

    callNext: (doctorId) =>
      up((d) => {
        const next =
          queueFor(
            d.appointments,
            doctorId
          )[0];

        if (next) {
          logAudit(
            "Queue Progressed",
            `Doctor called next patient: Token ${next.token}`
          );
        }

        return {
          appointments:
            d.appointments.map(
              (a) =>
                a.doctorId === doctorId &&
                a.date === today() &&
                (a.status ===
                  "in-consult" ||
                  a.status ===
                    "in-progress")
                  ? {
                      ...a,
                      status: "completed",
                    }
                  : next &&
                    a.id === next.id
                  ? {
                      ...a,
                      status: "in-consult",
                    }
                  : a
            ),
        };
      }),

    // -------------------------------------------------------
    // UPDATE PROFILE
    // -------------------------------------------------------

    updateProfile: (
      profileData
    ) => {
      if (!user) return;

      up((d) => ({
        users: d.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                ...profileData,
              }
            : u
        ),
      }));

      logAudit(
        "Profile Edit",
        `Patient updated their profile details`
      );

      say(
        "Profile updated successfully."
      );
    },

    // -------------------------------------------------------
    // DEMO DATA
    // -------------------------------------------------------

    loadDemoData: (doctorId) => {
      const day = (o) => {
        const d = new Date();
        d.setDate(d.getDate() + o);

        return d.toLocaleDateString(
          "en-CA"
        );
      };

      const names = [
        "Aarav Mehta",
        "Priya Nair",
        "Rohan Gupta",
        "Sneha Reddy",
        "Kiran Patel",
        "Ananya Roy",
        "Vikram Singh",
        "Divya Iyer",
        "Arjun Das",
        "Meena Kapoor",
      ];

      const reasons = [
        "Fever & cold",
        "Routine check-up",
        "Chest pain",
        "Follow-up",
        "Blood pressure",
        "Skin allergy",
      ];

      const times = [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "14:00",
        "15:00",
        "16:00",
        "17:30",
      ];

      const states = [
        "completed",
        "completed",
        "completed",
        "in-consult",
        "waiting",
        "waiting",
        "waiting",
        "waiting",
        "cancelled",
        "no-show",
      ];

      const demoUsers =
        names.map((n, i) => ({
          id: `demo-p${i}`,
          demo: true,
          name: n,
          email: `demo${i}@example.com`,
          role: "patient",
          status: "active",

          phone: `+91 98765 4${
            1000 + i * 37
          }`,

          bloodGroup: [
            "O+",
            "A+",
            "B+",
            "AB+",
          ][i % 4],

          age: `${24 + i * 5} yrs`,

          gender:
            i % 2
              ? "Female"
              : "Male",

          allergies:
            i % 4 === 2
              ? "Penicillin"
              : "None",

          emergencyContact: `+91 98765 11${
            200 + i
          }`,
        }));

      const mk = (
        id,
        i,
        date,
        status,
        priority = "normal"
      ) => ({
        id,
        demo: true,

        patientId: `demo-p${
          i % 10
        }`,

        patient:
          names[i % 10],

        doctorId,

        date,

        time:
          times[i % 10],

        token: `D-${String(
          i + 1
        ).padStart(3, "0")}`,

        status,

        priority,

        reason:
          reasons[i % 6],

        paymentStatus: "Paid",

        createdAt: today(),
      });

      const appts = [];

      states.forEach(
        (st, i) =>
          appts.push(
            mk(
              `demo-t${i}`,
              i,
              day(0),
              st,
              i === 7
                ? "urgent"
                : "normal"
            )
          )
      );

      [
        [-1, 4],
        [-2, 6],
        [-3, 3],
        [-4, 5],
        [-5, 2],
      ].forEach(
        ([o, n], k) => {
          for (
            let j = 0;
            j < n;
            j++
          ) {
            appts.push(
              mk(
                `demo-h${k}-${j}`,
                k + j,
                day(o),
                "completed"
              )
            );
          }
        }
      );

      [
        [1, 3],
        [2, 5],
        [3, 2],
        [4, 4],
        [6, 3],
      ].forEach(
        ([o, n], k) => {
          for (
            let j = 0;
            j < n;
            j++
          ) {
            appts.push(
              mk(
                `demo-u${k}-${j}`,
                k * 2 + j,
                day(o),
                "waiting"
              )
            );
          }
        }
      );

      up((d) => ({
        users: [
          ...d.users.filter(
            (u) => !u.demo
          ),
          ...demoUsers,
        ],

        appointments: [
          ...d.appointments.filter(
            (a) => !a.demo
          ),
          ...appts,
        ],
      }));

      say("Sample data loaded.");
    },

    clearDemoData: () => {
      up((d) => ({
        users:
          d.users.filter(
            (u) => !u.demo
          ),

        appointments:
          d.appointments.filter(
            (a) => !a.demo
          ),
      }));

      say("Sample data removed.");
    },

    // -------------------------------------------------------
    // NOTIFICATIONS
    // -------------------------------------------------------

    markNotificationsRead: (
      doctorId
    ) => {
      up((d) => ({
        notifications: (
          d.notifications || []
        ).map((n) =>
          !n.doctorId ||
          n.doctorId === doctorId
            ? {
                ...n,
                read: true,
              }
            : n
        ),
      }));

      say(
        "All notifications marked as read."
      );
    },

    // -------------------------------------------------------
    // MEDICINES
    // -------------------------------------------------------

    buyMedicines: ({
      items,
      address,
      total,
    }) => {
      const order = {
        id:
          "ORD-" +
          Math.floor(
            100000 +
              Math.random() *
                900000
          ),

        patientId: user.id,

        patientName:
          user.name,

        date: today(),

        time:
          new Date().toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),

        items,

        address:
          address ||
          user.address ||
          "Home Address",

        total,

        status:
          "Processing (Out for delivery in 2 hrs)",
      };

      up((d) => ({
        medicineOrders: [
          order,
          ...(d.medicineOrders || []),
        ],
      }));

      logAudit(
        "Pharmacy Order",
        `Order #${order.id} placed for ₹${total}`
      );

      say(
        `Order #${order.id} placed for ₹${total}! Delivery in 2 hours.`
      );

      return order;
    },

    // -------------------------------------------------------
    // LAB TESTS
    // -------------------------------------------------------

    bookLabTest: ({
      testName,
      category,
      price,
      date,
      timeSlot,
      type,
    }) => {
      const booking = {
        id:
          "LAB-" +
          Math.floor(
            10000 +
              Math.random() *
                90000
          ),

        patientId: user.id,

        patientName:
          user.name,

        testName,
        category,
        price,
        date,
        timeSlot,

        type:
          type ||
          "Home Sample Collection",

        status: "Confirmed",

        reportSummary:
          "Report will be available within 12 hours after sample collection.",
      };

      up((d) => ({
        labBookings: [
          booking,
          ...(d.labBookings || []),
        ],
      }));

      logAudit(
        "Lab Test Booked",
        `Booked ${testName} for ${date}`
      );

      say(
        `Lab test booked! Appointment: ${date} (${timeSlot}).`
      );

      return booking;
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}