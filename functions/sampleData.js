/* Change note: Added manual helper to load sample service types and customers for MVP testing. */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const serviceTypes = [
  {
    id: "srv001",
    name: "AC Maintenance",
    price: 100,
    duration: "1h",
  },
  {
    id: "srv002",
    name: "System Diagnostics",
    price: 80,
    duration: "45m",
  },
];

const customers = [
  {
    id: "cust001",
    name: "John Rivera",
    email: "john@example.com",
    phone: "7875551234",
  },
];

// Change note: Exposed manual loader to seed baseline catalog and contacts without auto-running.
const loadSampleData = async () => {
  const batch = db.batch();

  serviceTypes.forEach((service) => {
    const ref = db.collection("servicetypes").doc(service.id);
    batch.set(ref, service, { merge: true });
  });

  customers.forEach((customer) => {
    const ref = db.collection("customers").doc(customer.id);
    batch.set(ref, customer, { merge: true });
  });

  await batch.commit();
  return {
    serviceTypes: serviceTypes.length,
    customers: customers.length,
  };
};

module.exports = { loadSampleData };
