# WEPSUN ENGINEERING SOLUTIONS
## RBAC AUTHORIZATION & PERMISSION MATRIX

**Architecture:** Role-Based & Object-Level Access Control (RBAC & ABAC)  
**Database Identity:** PostgreSQL Multi-Tenant Identity via Prisma ORM  
**Version:** 2.0.0-milestone2  

---

## 1. System User Roles

The platform defines 7 distinct enterprise roles matching [`prisma/schema.prisma`](file:///d:/WEPSUN%20ENGINEERING%20SOLUTION/prisma/schema.prisma) and [`src/types/index.ts`](file:///d:/WEPSUN%20ENGINEERING%20SOLUTION/src/types/index.ts):

| Role Identifier | Role Enum (Database) | Title & Functional Description | Tenant Scope |
| :--- | :--- | :--- | :--- |
| **`super_admin`** | `SUPER_ADMIN` | Platform Super Administrator; Cross-company management & audits | Global / Cross-Tenant |
| **`company_admin`**| `COMPANY_ADMIN`| Lift Company Owner / MD; Full control of tenant company & branches | Tenant Isolated (`companyId`) |
| **`service_manager`**| `SERVICE_MANAGER`| Service Operations Head; Technician dispatch, PM schedules, tickets | Tenant Isolated (`companyId`) |
| **`technician`** | `TECHNICIAN` | Field Service Engineer; Mobile job attendance, GPS checkin, reports | Object & Tenant Isolated |
| **`client`** | `CLIENT` | Building Chairman / Secretary / Facility Manager; Lift passports, SOS | Object & Tenant Isolated |
| **`accounts`** | `ACCOUNTS` | Finance & Commercial Executive; Invoices, payments, AMC revenue | Tenant Isolated (`companyId`) |
| **`sales`** | `SALES` | Sales & Marketing Engineer; Quotations, modernization leads, CRM | Tenant Isolated (`companyId`) |

---

## 2. API Domain Permission Matrix

| Module / Resource | Endpoint | `SUPER_ADMIN` | `COMPANY_ADMIN` | `SERVICE_MANAGER` | `TECHNICIAN` | `CLIENT` | `ACCOUNTS` | `SALES` | Object-Level Constraint |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Auth & Profile** | `/api/auth/me` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Own identity only |
| | `/api/auth/change-password` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Own session only |
| **Companies & Branches**| `GET /api/companies` | ✅ (All) | ✅ (Own) | ✅ (Own) | ✅ (Own) | ✅ (Own) | ✅ (Own) | ✅ (Own) | Tenant `companyId` |
| | `GET /api/companies/branches`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Tenant `companyId` |
| **Lifts & Passports** | `GET /api/lifts` | ✅ | ✅ | ✅ | ✅ | ✅ (Own Bld)| ✅ | ✅ | Client: Own building only |
| | `GET /api/lifts/:id` | ✅ | ✅ | ✅ | ✅ | ✅ (Own Bld)| ✅ | ✅ | Public QR allowed via token |
| | `POST /api/lifts` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Admin only |
| | `PATCH /api/lifts/:id/status`| ✅ | ✅ | ✅ | ✅ (On-Job)| ❌ | ❌ | ❌ | Tech: assigned lift only |
| **Complaints & SOS** | `GET /api/complaints` | ✅ | ✅ | ✅ | ✅ (Assigned)|✅ (Own Bld)| ❌ | ❌ | Scoped to assignment / ownership |
| | `POST /api/complaints` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Client creates SOS tickets |
| | `PATCH /api/complaints/:id` | ✅ | ✅ | ✅ | ✅ (Assigned)| ❌ | ❌ | ❌ | Tech updates resolution notes |
| **Field Technicians** | `GET /api/technicians` | ✅ | ✅ | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | Tech: Own profile only |
| | `POST /api/technicians/check-in`| ✅ | ✅ | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | Tech GPS location update |
| **Service Reports** | `GET /api/service-reports`| ✅ | ✅ | ✅ | ✅ (Assigned)|✅ (Own Bld)| ❌ | ❌ | Customer can download reports |
| | `POST /api/service-reports` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Technician signs off job |
| **Preventive Maint.** | `GET /api/pm/schedules` | ✅ | ✅ | ✅ | ✅ | ✅ (Own Bld)| ❌ | ❌ | Calendar visibility |
| | `POST /api/pm/complete` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 4-Zone checklist execution |
| **AMC Contracts** | `GET /api/amc` | ✅ | ✅ | ✅ | ❌ | ✅ (Own) | ✅ | ✅ | Client sees active contract |
| | `POST /api/amc` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | Accounts / Admin creates AMC |
| **Quotations** | `GET /api/quotations` | ✅ | ✅ | ✅ | ❌ | ✅ (Own) | ✅ | ✅ | Client reviews quotes |
| | `POST /api/quotations` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | Sales / Admin creates quotes |
| | `POST /api/quotations/:id/convert`| ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | Client approves -> WO & Inv |
| **Work Orders** | `GET /api/work-orders` | ✅ | ✅ | ✅ | ✅ (Assigned)| ❌ | ✅ | ❌ | Tech sees assigned work |
| | `POST /api/work-orders` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Service Desk creates WO |
| **Invoices & Payments**| `GET /api/invoices` | ✅ | ✅ | ❌ | ❌ | ✅ (Own) | ✅ | ❌ | Client views own dues |
| | `POST /api/invoices/:id/pay`| ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | Razorpay / UPI settlement |
| **Inventory & Stock** | `GET /api/inventory` | ✅ | ✅ | ✅ | ✅ (Read) | ❌ | ✅ | ❌ | Tech views spare parts catalog |
| | `POST /api/inventory/movements`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Double-entry stock issue |
| **Customer Feedback** | `GET /api/feedback` | ✅ | ✅ | ✅ | ❌ | ✅ (Own) | ❌ | ❌ | Public review submission |
| | `POST /api/feedback/submit` | ✅ | ✅ | ✅ | ❌ | ✅ (Public) | ❌ | ❌ | Verified CSAT submission |
| | `POST /api/feedback/:id/reply`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Management responds |
| **Notifications** | `GET /api/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Filtered by userId / companyId |
| **Audit Logs** | `GET /api/audit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Admin regulatory review |
| **Public QR Code** | `GET /api/qr/lift/:token`| 🌐 Public (No Auth Required — Cryptographically verified random token) |

---

## 3. Object-Level Authorization (ABAC) Rules

1. **Technician Object Isolation:**
   - A technician querying `/api/complaints` or `/api/work-orders` only receives records where `assignedTechnicianId === req.user.technicianId` (unless role is `SERVICE_MANAGER` or higher).
   - A technician cannot submit a GPS check-in on behalf of another technician ID.

2. **Customer / Client Object Isolation:**
   - A client querying `/api/lifts`, `/api/complaints`, `/api/invoices`, or `/api/service-reports` only receives records belonging to `req.user.clientId` or buildings mapped to their society.
   - A client cannot approve or view quotations belonging to another client.

3. **Multi-Tenant Partition Key:**
   - Every protected route asserts `where: { companyId: req.user.companyId }`.
   - `SUPER_ADMIN` can override tenant scope only when an explicit query parameter `?companyId=...` is provided and authenticated.
