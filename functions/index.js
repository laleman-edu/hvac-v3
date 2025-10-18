/* Change note: Extended Cloud Functions to log appointments and seed invoice metadata for MVP backend events. */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendServiceConfirmation = functions.firestore
  .document("serviceRequests/{requestId}")
  .onCreate(async (snapshot) => {
    const request = snapshot.data();
    functions.logger.info("Service confirmation pending email dispatch", {
      requestId: snapshot.id,
      customerEmail: request.customerEmail,
    });
    return true;
  });

// Change note: Added appointment creation trigger to surface operational logs for scheduling.
exports.logAppointmentCreation = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snapshot) => {
    const appointment = snapshot.data();
    functions.logger.info("New appointment created", {
      appointmentId: snapshot.id,
      serviceType: appointment.serviceType,
      scheduledDate: appointment.scheduledDate,
    });
    // TODO: Integrate email/text notification workflow for technicians.
    return true;
  });

// Change note: Added invoice creation trigger to stamp issuedAt field and prep messaging hook.
exports.initializeInvoiceMetadata = functions.firestore
  .document("invoices/{invoiceId}")
  .onCreate(async (snapshot) => {
    const invoice = snapshot.data();
    if (!invoice.issuedAt) {
      await snapshot.ref.update({
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    functions.logger.info("Invoice metadata initialized", {
      invoiceId: snapshot.id,
      customerEmail: invoice.customerEmail,
    });
    // TODO: Dispatch invoice ready email via transactional provider.
    return true;
  });

exports.sendInvoiceNotification = functions.firestore
  .document("invoices/{invoiceId}")
  .onWrite(async (change) => {
    const invoice = change.after.exists ? change.after.data() : null;
    // Change note: Ensured invoice ID logging works for both create/update and delete events.
    const invoiceId = change.after.exists ? change.after.id : change.before.id;
    functions.logger.info("Invoice notification pipeline invoked", {
      invoiceId,
      status: invoice?.status ?? "deleted",
    });
    return true;
  });
