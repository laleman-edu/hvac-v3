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
  serverTimestamp,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  orderBy
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
const descriptionInput = document.getElementById("description");
const requestIdInput = document.getElementById("requestId");
const dateInput = document.getElementById("appointmentDate");
const timeInput = document.getElementById("appointmentTime");

const authCard = document.getElementById("auth-card");
const scheduleCard = document.getElementById("scheduleCard");
const scheduleHint = document.getElementById("schedule-hint");
const serviceTableWrapper = document.getElementById("serviceTableWrapper");
const serviceTypeSelect = document.getElementById("serviceTypeSelect");
const accountFieldset = document.getElementById("accountFieldset");
const accountNameInput = document.getElementById("accountName");
const accountEmailInput = document.getElementById("accountEmail");
const accountTelephoneInput = document.getElementById("accountTelephone");
const accountChannelSelect = document.getElementById("accountChannel");
const btnSaveAccount = document.getElementById("btn-save-account");
const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (accountFieldset) {
  accountFieldset.classList.add("is-disabled");
}

// Track commitment flow for scheduling access
let userIsLoggedIn = false;
let hasCommittedRequest = false;
let lastCreatedRequestId = "";
let serviceTypesCache = [];
const staticServiceTypesFallback = [
  { id: "srv001", name: "AC Maintenance", price: 100, duration: "1h" },
  { id: "srv002", name: "System Diagnostics", price: 80, duration: "45m" },
  { id: "srv003", name: "Heat Pump Tune-Up", price: 140, duration: "90m" },
  { id: "srv004", name: "Duct Cleaning Bundle", price: 220, duration: "2h" },
];

// Change note: Added helper to toggle account form availability based on auth state.
const toggleAccountFieldset = (enabled) => {
  if (!accountFieldset) return;
  accountFieldset.disabled = !enabled;
  accountFieldset.classList.toggle("is-disabled", !enabled);
};

// Change note: Added helper to populate account editor from Firestore profile.
const populateAccountForm = (data = {}) => {
  if (!accountFieldset || !accountNameInput || !accountEmailInput || !accountTelephoneInput || !accountChannelSelect) {
    return;
  }
  accountNameInput.value = data.name || "";
  accountEmailInput.value = data.email || auth.currentUser?.email || "";
  accountTelephoneInput.value = data.telephone || "";
  accountChannelSelect.value = data.preferredCommunicationChannel || "";
};

// Change note: Added reset to blank profile when session ends.
const clearAccountForm = () => {
  if (!accountNameInput || !accountEmailInput || !accountTelephoneInput || !accountChannelSelect) {
    return;
  }
  accountNameInput.value = "";
  accountEmailInput.value = "";
  accountTelephoneInput.value = "";
  accountChannelSelect.value = "";
};

// Change note: Added Firestore loader to hydrate account editor when available.
const loadAccountProfile = async (uid) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, "customers", uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      populateAccountForm(data);
      return data;
    }
  } catch (error) {
    console.error("Failed to load customer profile", error);
  }
  populateAccountForm();
  return null;
};

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
// Change note: Rendering Firestore-driven service catalog table and dropdown.
const renderServiceCatalog = (services = []) => {
  if (!serviceTableWrapper || !serviceTypeSelect) return;

  serviceTableWrapper.innerHTML = "";
  serviceTypeSelect.innerHTML = "";

  if (!services.length) {
    serviceTableWrapper.innerHTML =
      "<p class=\"hint\">No service types configured yet.</p>";
    serviceTypeSelect.innerHTML = "<option value=\"\">No services available</option>";
    return;
  }

  const table = document.createElement("table");
  table.className = "service-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th scope=\"col\">Service</th>
      <th scope=\"col\">Price</th>
      <th scope=\"col\">Duration</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");
  services.forEach(({ id, name, price, duration }) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${name}</td>
      <td>${typeof price === "number" ? `$${price.toFixed(2)}` : price}</td>
      <td>${duration || "—"}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  serviceTableWrapper.appendChild(table);

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a service type";
  serviceTypeSelect.appendChild(defaultOption);

  services.forEach(({ id, name }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    serviceTypeSelect.appendChild(option);
  });
};

// Change note: Added fallback loader consuming static JSON when Firestore is empty or unavailable.
const loadServiceTypesFallback = async () => {
  try {
    const response = await fetch("/sampledata/serviceTypes.json");
    if (!response.ok) throw new Error("Fallback service types not found.");
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) {
      return staticServiceTypesFallback;
    }
    return data;
  } catch (error) {
    console.error("Fallback service types load failed", error);
    return staticServiceTypesFallback;
  }
};

const fetchServiceTypes = async () => {
  if (!serviceTableWrapper || !serviceTypeSelect) return;
  serviceTableWrapper.innerHTML = "<p class=\"hint\">Loading service types...</p>";
  serviceTypeSelect.innerHTML = "<option value=\"\">Loading...</option>";
  try {
    const serviceTypeQuery = query(
      collection(db, "servicetypes"),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(serviceTypeQuery);
    const fetched = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    serviceTypesCache =
      fetched.length > 0 ? fetched : await loadServiceTypesFallback();
    renderServiceCatalog(serviceTypesCache);
  } catch (error) {
    console.error("Failed to load service types", error);
    serviceTypesCache = await loadServiceTypesFallback();
    renderServiceCatalog(serviceTypesCache);
  }
};

fetchServiceTypes();

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

// Change note: Added save handler to persist enriched account profile fields.
btnSaveAccount?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    return alert("Login is required before updating account details.");
  }

  if (!accountNameInput || !accountEmailInput || !accountTelephoneInput || !accountChannelSelect) {
    console.error("Account form elements missing");
    return alert("Account form is unavailable. Refresh and try again.");
  }

  const payload = {
    name: accountNameInput.value.trim(),
    email: accountEmailInput.value.trim() || user.email || "",
    telephone: accountTelephoneInput.value.trim(),
    preferredCommunicationChannel: accountChannelSelect.value,
    updatedAt: serverTimestamp(),
  };

  if (!payload.name || !payload.email || !payload.telephone || !payload.preferredCommunicationChannel) {
    return alert("Please complete all account fields before saving.");
  }

  try {
    await setDoc(doc(db, "customers", user.uid), {
      ...payload,
      uid: user.uid,
    }, { merge: true });
    alert("Account details saved!");
  } catch (error) {
    console.error(error);
    alert("Failed to save account: " + error.message);
  }
});

// Track session
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Auth state change detected:", user.email || user.uid);
    if (btnLogout) btnLogout.style.display = "inline";
    userIsLoggedIn = true;
    toggleAccountFieldset(true);
    loadAccountProfile(user.uid);
  } else {
    console.log("No active session.");
    if (btnLogout) btnLogout.style.display = "none";
    userIsLoggedIn = false;
    hasCommittedRequest = false;
    lastCreatedRequestId = "";
    toggleAccountFieldset(false);
    clearAccountForm();
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

  const selectedServiceType = serviceTypeSelect?.value || "";
  const description = descriptionInput.value.trim();
  if (!selectedServiceType) {
    return alert("Select a service type from the catalog dropdown before submitting.");
  }
  if (!description) return alert("Please provide a brief description.");

  try {
    const serviceMeta = serviceTypesCache.find((svc) => svc.id === selectedServiceType) || {};
    const docRef = await addDoc(collection(db, "requests"), {
      uid: user.uid,
      email: user.email || "anonymous",
      serviceTypeId: selectedServiceType,
      serviceTypeName: serviceMeta.name || "",
      description,
      status: "Pending",
      createdAt: serverTimestamp()
    });
    alert(`Service request submitted! Confirmation ID: ${docRef.id}`);
    descriptionInput.value = "";
    if (serviceTypeSelect) {
      serviceTypeSelect.value = "";
    }

    hasCommittedRequest = true;
    lastCreatedRequestId = docRef.id;
    updateScheduleVisibility();
  } catch (e) {
    console.error(e);
    alert("Error submitting request: " + e.message);
  }
});

// --------------- Appointment Scheduling ---------------
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
