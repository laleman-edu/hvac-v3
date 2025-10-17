# HVAC Service Management System – MVP Requirements (V3.1)

## 1. Objective
Deliver a **minimum viable product** to manage service scheduling, invoicing, and payments for an HVAC provider, deployable on Firebase and usable from laptop or phone.

---

## 2. MVP Functional Modules

### 2.1 Users
| Role | Capabilities |
|------|---------------|
| Admin | Manage services, appointments, invoices, and payments. |
| Customer | Request service, confirm appointment, review invoice, pay online. |

---

### 2.2 Core Workflows

#### a. Service Scheduling
- Customer submits request (service type, preferred date/time, contact info).
- Admin reviews and confirms appointment.
- Notification sent automatically (email or WhatsApp).
- Record stored with:
  - Transaction ID, dates, service type, customer details, source (referral/Google).

#### b. Invoicing
- Admin generates invoice with:
  - Charge type, description, parts (optional), subtotal, tax, total.
- System stores invoice as document in Firestore.
- Invoice sent to customer for approval/payment.

#### c. Payments
- Payment processed via Stripe Checkout (prototype integration).
- Payment record includes:
  - Date/time, method, amount, status.
- Automatic receipt emailed to both parties.

---

### 2.3 Reporting (Phase 1)
- Daily / weekly / monthly totals.
- Unpaid vs paid invoices.
- Tax summary.

---

### 2.4 Messaging
- Confirmation & payment messages via Firebase Functions (email trigger).
- Template files stored under `/functions/templates/`.

---

### 2.5 Data Entities
Customer, Appointment, Invoice, Payment, ServiceType.  
Each includes timestamps and owner references (user UID).

---

## 3. Non-Functional Requirements
| Category | Requirement |
|-----------|-------------|
| Framework | Firebase Hosting + Firestore + Functions + Auth |
| UI | HTML / CSS / JS responsive |
| Security | HTTPS + Firestore rules (role-based) |
| Backup | Firebase automatic backup |
| Documentation | Update `scripts/README.md` after each Codex or CLI change |

---

## 4. Deliverables
- Web app prototype hosted on Firebase.  
- Admin dashboard for appointments/invoices.  
- Email confirmation for new requests and completed payments.  
- Minimal accounting summary report.

---

## 5. Next Steps (Post-MVP)
- Technician role integration.
- Inventory module.
- Advanced reporting (tax breakdown, income by service type).
- WhatsApp API notifications.

---

## 6. Version Control
- Commit message format:  
  `feat: add [module/function] – comment on Codex change`
- Update `scripts/README.md` after each push.

---

**MVP Goal:** Achieve a deployable, testable product that demonstrates end-to-end service management—appointment → invoice → payment—using Firebase Hosting + Firestore.