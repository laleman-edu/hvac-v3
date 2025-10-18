/* Change note: Implemented client bootstrap to submit service requests to Firestore and show status feedback. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const statusEl = document.getElementById("formStatus");
const form = document.getElementById("serviceRequestForm");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const handleFormSubmit = async (event) => {
  event.preventDefault();
  statusEl.textContent = "Submitting request...";
  try {
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      serviceType: data.serviceType,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || null,
      source: "web",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerUid: auth.currentUser?.uid ?? null,
    };
    await addDoc(collection(db, "serviceRequests"), payload);
    form.reset();
    statusEl.textContent =
      "Thanks! We logged your request and will confirm shortly.";
  } catch (error) {
    console.error("Failed to submit service request", error);
    statusEl.textContent =
      "We could not submit your request. Please try again or call us.";
  }
};

const initializeAuth = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    form?.addEventListener("submit", handleFormSubmit);
  }
});

initializeAuth().catch((error) => {
  console.error("Anonymous auth failed", error);
  statusEl.textContent =
    "Authentication failed. Refresh the page or contact support.";
});
