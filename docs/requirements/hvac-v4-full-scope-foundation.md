# HVAC Service Management System – Full Scope Foundation (V4)

## 1. Purpose
Develop a responsive, mobile-friendly platform to manage every activity of an independent or multi-technician HVAC service provider, from appointment scheduling to payment and accounting.  
The architecture must support scalability, multi-user roles, and secure data management.

---

## 2. Core Objectives
- Centralize appointment management and confirmations.
- Automate customer notifications and technician dispatch.
- Handle invoicing, payments, and parts tracking.
- Generate accounting/tax reports and performance insights.
- Maintain audit trails for accountability and compliance.

---

## 3. Functional Modules

### 3.1 User Roles and Permissions
| Role | Description | Access Level |
|------|--------------|--------------|
| Super Admin | Oversees all providers and system settings. | Global |
| Provider Admin | Manages own business data, technicians, and pricing. | Business scope |
| Technician | Handles assigned jobs and parts usage. | Assigned jobs only |
| Customer | Requests services, approves estimates, makes payments. | Own data only |

### 3.2 Authentication
- Email/password or OAuth (Google/Apple).
- Role-based dashboards.
- Password reset and optional MFA.

### 3.3 Scheduling & Appointments
- CRUD appointments with date/time, service type, and technician assignment.
- Messaging confirmation via SMS, WhatsApp, or email.
- Status workflow: Pending → Scheduled → In Progress → Completed → Billed → Paid.

### 3.4 Messaging & Notifications
- Triggered messages for key events (request, confirm, complete, invoice, payment).
- Provider-editable templates.
- Logging via `MessageLog` entity.

### 3.5 Services & Estimates
- Configurable service catalog.
- Estimates linked to appointments.
- Customer approval online.

### 3.6 Invoicing & Payments
- Invoice structure:
  - Charge type, account, service type, parts, subtotal, taxes, total.
- Payment options:
  - Stripe, PayPal, cash/manual.
- Automatic receipts emailed to customer and provider.
- Reconciliation dashboard.

### 3.7 Inventory & Parts
- CRUD operations.
- Track usage per job.
- Reorder threshold alerts.

### 3.8 Accounting & Reporting
**Minimum:**  
Sales by date, taxes collected, unpaid invoices, parts summary, net income.  
**Optional:**  
Technician productivity, customer origin analytics.

### 3.9 CRM
- Contact info, awareness source, service history, satisfaction feedback.
- Messaging consent tracking.

---

## 4. Non-Functional Requirements
| Category | Requirement |
|-----------|-------------|
| UI/UX | Mobile-first responsive design |
| Performance | Sub-2 s page load; local caching |
| Scalability | Multi-tenant ready |
| Security | HTTPS, JWT, Firestore rules |
| Data retention | 7 years financial |
| Backup | Daily cloud backup |
| Deployment | Firebase Hosting + Firestore + Functions |
| Integration | APIs for QuickBooks, HubSpot, Twilio |

---

## 5. Database Entities
Customer, Appointment, ServiceType, Invoice, Payment, Part, Technician, Provider, MessageLog, AuditLog.  
All include created/updated timestamps and relational references.

---

## 6. Future Extensions
- Multi-language (EN/ES)
- AI scheduling optimization
- Technician GPS tracking
- Dashboard analytics
- Google Calendar & Maps integration

---

## 7. Compliance & Security
- Encryption at rest and in transit.
- GDPR/CCPA compliance.
- Consent logs.
- Access control via Firestore rules.

---

## 8. Documentation & Versioning
- Store under `/docs/requirements/`.
- Reference in `scripts/README.md`.
- Document Codex modifications with inline `#comment` markers.
- All commits must include summary of functional change.

---

## 9. Summary
This Full Scope Foundation (V4) defines the architecture for a scalable, cloud-based HVAC service platform that can evolve from MVP to enterprise level with minimal redesign.