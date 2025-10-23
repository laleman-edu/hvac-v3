/* ============================================================
   HVAC-V3 – Phase 5
   Customer Auth + Service Request Integration
   ============================================================ */

// --------------- Imports ---------------
import { initializeApp, getApps, getApp } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// --------------- Firebase Configuration ---------------
const firebaseConfig = {
  apiKey: "AIzaSyCAwJjD6mPd1gX1XdPYZ3s-wOM5mjuKkLQ",
  authDomain: "hvac-v3.firebaseapp.com",
  projectId: "hvac-v3",
  storageBucket: "hvac-v3.appspot.com",
  messagingSenderId: "391662809459",
  appId: "1:391662809459:web:f052c962d6c409b5a29506"
};

// --------------- Initialize App Safely ---------------
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// --------------- UI References ---------------
const btnLogin   = document.getElementById("btn-login");
const btnSignup  = document.getElementById("btn-signup");
const btnLogout  = document.getElementById("btn-logout");
const btnRequest = document.getElementById("btn-request");
const btnSchedule = document.getElementById("btn-schedule");

const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const serviceTypeInput = document.getElementById("serviceType");
const descriptionInput = document.getElementById("description");
const requestIdInput = document.getElementById("requestId");
const dateInput = document.getElementById("appointmentDate");
const timeInput = document.getElementById("appointmentTime");

const authCard = document.getElementById("auth-card");
const scheduleCard = document.getElementById("scheduleCard");
const scheduleHint = document.getElementById("schedule-hint");
const serviceListContainer = document.getElementById("service-list");
const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

// Track commitment flow for scheduling access
let userIsLoggedIn = false;
let hasCommittedRequest = false;
let lastCreatedRequestId = "";

const updateScheduleVisibility = () => {
  if (!scheduleCard || !btnSchedule || !scheduleHint) return;

  const canSchedule = userIsLoggedIn && hasCommittedRequest;
  scheduleCard.classList.toggle("is-hidden", !canSchedule);
  scheduleCard.setAttribute("aria-hidden", String(!canSchedule));
  btnSchedule.disabled = !canSchedule;

  scheduleHint.textContent = canSchedule
    ? "Select a time that works for you. We pre-filled the most recent request."
    : "We’ll unlock scheduling once you submit a request while logged in.";

  if (canSchedule && lastCreatedRequestId && requestIdInput) {
    requestIdInput.value = lastCreatedRequestId;
  } else if (!canSchedule && requestIdInput) {
    requestIdInput.value = "";
  }
};

// --------------- Service Catalog Rendering ---------------
const sampleServices = [
  { name: "AC Tune-Up", response: "48 hrs", starting: "$89" },
  { name: "Emergency Cooling Repair", response: "4 hrs", starting: "$249" },
  { name: "Heater Diagnostic", response: "24 hrs", starting: "$119" },
  { name: "Duct Cleaning", response: "72 hrs", starting: "$199" },
  { name: "Thermostat Installation", response: "36 hrs", starting: "$129" },
  { name: "Indoor Air Quality Audit", response: "72 hrs", starting: "$149" },
  { name: "Commercial Maintenance Plan", response: "Custom", starting: "Quote" }
];

const renderServiceCatalog = () => {
  if (!serviceListContainer) return;

  const table = document.createElement("table");
  table.className = "service-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th scope="col">Service</th>
      <th scope="col">Typical Response</th>
      <th scope="col">Starting Price</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");
  sampleServices.forEach(({ name, response, starting }) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${name}</td>
      <td>${response}</td>
      <td>${starting}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  serviceListContainer.innerHTML = "";
  serviceListContainer.appendChild(table);
};

renderServiceCatalog();

// --------------- Auth Event Handlers ---------------

// Create account
btnSignup?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passInput.value.trim();
  if (!email || !pass) return alert("Please enter both email and password.");

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("Account created successfully!");
  } catch (e) {
    console.error(e);
    if (e.code === "auth/weak-password") {
      alert("Password must be at least 6 characters long.");
    } else if (e.code === "auth/email-already-in-use") {
      alert("That email is already registered. Try logging in instead.");
    } else if (e.code === "auth/invalid-email") {
      alert("Please enter a valid email address.");
    } else {
      alert("Signup error: " + e.message);
    }
  }
});

// Login
btnLogin?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passInput.value.trim();
  if (!email || !pass) return alert("Enter email and password.");
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert("Login successful!");
  } catch (e) {
    console.error(e);
    alert("Login error: " + e.message);
  }
});

// Logout
btnLogout?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("You have logged out.");
  } catch (e) {
    console.error(e);
  }
});

// Track session
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Auth state change detected:", user.email || user.uid);
    if (btnLogout) btnLogout.style.display = "inline";
    userIsLoggedIn = true;
  } else {
    console.log("No active session.");
    if (btnLogout) btnLogout.style.display = "none";
    userIsLoggedIn = false;
    hasCommittedRequest = false;
    lastCreatedRequestId = "";
  }
  updateScheduleVisibility();
});

// --------------- Service Request Form ---------------
btnRequest?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    authCard?.scrollIntoView({ behavior: "smooth", block: "start" });
    return alert("Please log in or create an account to submit your request.");
  }

  const serviceType = serviceTypeInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!serviceType || !description)
    return alert("Please complete both fields.");

  try {
    const docRef = await addDoc(collection(db, "requests"), {
      uid: user.uid,
      email: user.email || "anonymous",
      serviceType,
      description,
      status: "Pending",
      createdAt: serverTimestamp()
    });
    alert(`Service request submitted! Confirmation ID: ${docRef.id}`);
    serviceTypeInput.value = "";
    descriptionInput.value = "";

    hasCommittedRequest = true;
    lastCreatedRequestId = docRef.id;
    updateScheduleVisibility();
  } catch (e) {
    console.error(e);
    alert("Error submitting request: " + e.message);
  }
});

// --------------- Appointment Scheduling ---------------
import { updateDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

btnSchedule?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Please log in first.");

  const reqId = requestIdInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  if (!reqId || !date || !time) return alert("Please fill all fields.");

  try {
    const reqRef = doc(db, "requests", reqId);
    await updateDoc(reqRef, {
      appointmentDate: date,
      appointmentTime: time,
      status: "Scheduled"
    });
    alert("Appointment scheduled!");
    requestIdInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
  } catch (e) {
    console.error(e);
    alert("Error scheduling appointment: " + e.message);
  }
});
