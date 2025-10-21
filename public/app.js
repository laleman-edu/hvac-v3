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

const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const serviceTypeInput = document.getElementById("serviceType");
const descriptionInput = document.getElementById("description");

// --------------- Auth Event Handlers ---------------

// Create account
btnSignup.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passInput.value.trim();
  if (!email || !pass) return alert("Enter email and password.");
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("Account created successfully!");
  } catch (e) {
    console.error(e);
    alert("Signup error: " + e.message);
  }
});

// Login
btnLogin.addEventListener("click", async () => {
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
btnLogout.addEventListener("click", async () => {
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
    btnLogout.style.display = "inline";
  } else {
    console.log("No active session.");
    btnLogout.style.display = "none";
  }
});

// --------------- Service Request Form ---------------
btnRequest.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Please log in first.");

  const serviceType = serviceTypeInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!serviceType || !description)
    return alert("Please complete both fields.");

  try {
    await addDoc(collection(db, "requests"), {
      uid: user.uid,
      email: user.email || "anonymous",
      serviceType,
      description,
      status: "Pending",
      createdAt: serverTimestamp()
    });
    alert("Service request submitted!");
    serviceTypeInput.value = "";
    descriptionInput.value = "";
  } catch (e) {
    console.error(e);
    alert("Error submitting request: " + e.message);
  }
});