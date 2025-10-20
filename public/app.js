/* Change note: Expanded client bootstrap with email/password auth scaffolding and service type listing logic. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCAwJjD6mPd1gX1XdPYZ3s-wOM5mjuKkLQ",
  authDomain: "hvac-v3.firebaseapp.com",
  projectId: "hvac-v3",
  storageBucket: "hvac-v3.appspot.com",  // ✅ fixed
  messagingSenderId: "391662809459",
  appId: "1:391662809459:web:f052c962d6c409b5a29506"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const statusEl = document.getElementById("formStatus");
const form = document.getElementById("serviceRequestForm");
const yearEl = document.getElementById("year");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const serviceTypesList = document.getElementById("serviceTypesList");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Change note: Helper toggles auth-only UI elements based on user session state.
const updateAuthUI = (user) => {
  const authStatusEl = document.getElementById("authStatus");
  if (authStatusEl) {
    authStatusEl.textContent = user
      ? `Signed in as ${user.email ?? "guest"}`
      : "Not signed in";
  }
  if (logoutButton) {
    logoutButton.disabled = !user;
  }
};

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

// Change note: Added placeholder email/password login handler for MVP testing.
const loginUser = async (event) => {
  event.preventDefault();
  if (!loginForm) return;
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  console.log("Attempting login", { email });
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
    loginForm.reset();
  } catch (error) {
    console.error("Login failed", error);
  }
};

// Change note: Added logout helper to support manual session resets during demos.
const logoutUser = async () => {
  console.log("Attempting logout");
  try {
    await signOut(auth);
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// Change note: Added snapshot fetcher to display service types within the landing page.
const fetchServiceTypes = async () => {
  if (!serviceTypesList) return;
  serviceTypesList.innerHTML = "<li>Loading service catalog...</li>";
  try {
    const serviceTypeQuery = query(
      collection(db, "servicetypes"),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(serviceTypeQuery);
    if (snapshot.empty) {
      serviceTypesList.innerHTML = "<li>No service types configured yet.</li>";
      return;
    }
    serviceTypesList.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const item = document.createElement("li");
      item.textContent = `${data.name} – $${data.price} (${data.duration})`;
      serviceTypesList.appendChild(item);
    });
  } catch (error) {
    console.error("Failed to load service types", error);
    serviceTypesList.innerHTML =
      "<li>Unable to load service types. Check Firestore rules.</li>";
  }
};

// Change note: Added auth listener to keep UI state and data fetches in sync with session.
const authStateListener = () => {
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state change detected", { uid: user?.uid ?? null });
    updateAuthUI(user);
    if (user) {
      if (form && !form.dataset.boundToSubmit) {
        form.addEventListener("submit", handleFormSubmit);
        form.dataset.boundToSubmit = "true";
      }
      fetchServiceTypes();
    } else {
      fetchServiceTypes();
    }
  });
};

loginForm?.addEventListener("submit", loginUser);
logoutButton?.addEventListener("click", logoutUser);

authStateListener();

signInAnonymously(auth).catch((error) => {
  console.error("Anonymous auth failed", error);
  if (statusEl) {
    statusEl.textContent =
      "Authentication failed. Refresh the page or contact support.";
  }
});
