/* Change note: Added manual helper to load sample service types and customers for MVP testing. */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Change note: Pulled service types from shared JSON to keep seed data in sync with UI dropdown.
const serviceTypes = require("./serviceTypes.json");

// Change note: Sourced customer dataset from external JSON to simplify bulk editing.
const customers = require("./customers.json");

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
