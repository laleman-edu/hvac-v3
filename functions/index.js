/* Change note: Added Cloud Functions placeholders to emit confirmation and invoice notification logs for MVP. */
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

exports.sendInvoiceNotification = functions.firestore
  .document("invoices/{invoiceId}")
  .onWrite(async (change) => {
    const invoice = change.after.exists ? change.after.data() : null;
    functions.logger.info("Invoice notification pipeline invoked", {
      invoiceId: change.after.id,
      status: invoice?.status ?? "deleted",
    });
    return true;
  });
