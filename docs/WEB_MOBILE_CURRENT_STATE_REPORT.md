# WEPSUN ENGINEERING SOLUTIONS
## Comprehensive Web & Mobile Application Inspection Report

**Document ID:** WEP-INSPECT-WEB-MOBILE-2026  
**Target Platform:** WEPSUN Engineering Solutions (Lift Service & AMC Management Platform)  
**Inspection Date:** September 21, 2026  
**Auditor:** Senior Full-Stack & Mobile Systems Architect  
**Status:** **INSPECTION COMPLETE — FACTUAL REPOSITORY AUDIT**  

---

## 1. Repository Inspection: Web vs. Mobile

A complete filesystem audit was performed across the repository root, subdirectories, build configs, and package manifests.

### 1.1 Web Application Assets (Present & Operational)
* **Admin Web Dashboard:** Complete operations management interface located in `src/components/admin/` (19 component views: Overview Dashboard, Complaints, Work Orders, AMC & PM, Lifts, Quotations, Invoices, Inventory & Ledger, Technician Performance & GPS Radar, Feedback Manager, System Flowchart, Design System).
* **Customer Web Portal:** Client society/facility interface located in `src/components/client/` (11 component views: Client Dashboard, My Lifts, Lift Passports, Raise Complaint, SOS Emergency, Complaint Tracking, Service History, AMC Contracts, Quotation Approval, Payments, Feedback Modal).
* **Technician Web Interface:** Field service workflow located in `src/components/technician/` (4 component views: Technician Dashboard, AI Fault Diagnostics Assistant, 4-Zone PM Inspection Runner, Job Closure with Digital Signature & OTP).
* **Public Feedback Portal:** Standalone customer feedback and rating portal in `src/components/common/PublicFeedbackPage.tsx` accessible via URL hash `#feedback-form`.
* **Login & Authentication UI:** Enterprise login modal in `src/components/common/LoginModal.tsx` connected to the real JWT authentication API.
* **Role-Based Navigation:** Navigation controllers in `src/components/layout/` (`Header.tsx`, `Sidebar.tsx`, `Navbar.tsx`, `RoleSwitcher.tsx`).

### 1.2 Mobile Application Assets (Factual Status)

> [!IMPORTANT]
> **MOBILE APPLICATION NOT YET IMPLEMENTED.**  
> There is **NO** React Native application, **NO** Expo project, **NO** Flutter application, **NO** Capacitor application, **NO** Android native project (`android/`, Gradle, `.apk`), **NO** iOS native project (`ios/`, Xcode, `.pbxproj`), and **NO** Progressive Web App (PWA) service worker (`manifest.json` is missing).  
> The repository currently contains **ONLY A RESPONSIVE WEB APPLICATION** rendered inside a standard browser viewport.

---

## 2. Exact Project Structure

```
d:/WEPSUN ENGINEERING SOLUTION/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── mockDb.ts               # In-memory development fallback dataset
│   │   ├── lib/
│   │   │   ├── auth.ts                 # Bcrypt hashing, HS256 JWT, SHA-256 refresh sessions
│   │   │   └── prisma.ts               # Centralized Prisma Client singleton
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # requireAuth, requireRole, assertObjectOwnership
│   │   │   ├── rateLimiter.ts          # authLimiter (brute force) & apiLimiter
│   │   │   └── tenantScope.ts          # Multi-tenant header extraction
│   │   ├── routes/                     # 16 REST API route modules
│   │   │   ├── auth.routes.ts          # Login, refresh, logout, password recovery, me
│   │   │   ├── companies.routes.ts     # Multi-tenant company & branch endpoints
│   │   │   ├── lifts.routes.ts         # Digital passport, elevator fleet
│   │   │   ├── complaints.routes.ts    # Breakdown ticketing, auto-dispatch, tracking
│   │   │   ├── technicians.routes.ts   # GPS radar, check-in, performance
│   │   │   ├── serviceReports.routes.ts# Digital service reports, OTP verification
│   │   │   ├── pm.routes.ts            # 4-Zone PM schedules & execution records
│   │   │   ├── amc.routes.ts           # Comprehensive/Non-Comprehensive contracts
│   │   │   ├── quotations.routes.ts    # Quotations & atomic work order conversion
│   │   │   ├── workOrders.routes.ts    # Dispatch work orders & job status
│   │   │   ├── invoices.routes.ts      # Tax invoices & payment linkage
│   │   │   ├── payments.routes.ts      # Razorpay order generation & settlement
│   │   │   ├── inventory.routes.ts     # Spare parts catalog & double-entry ledger
│   │   │   ├── feedback.routes.ts      # Customer reviews, CSAT, admin replies
│   │   │   ├── notifications.routes.ts # User & tenant notifications
│   │   │   └── audit.routes.ts         # Immutable enterprise audit logs
│   │   ├── tests/
│   │   │   ├── dbIntegration.test.ts   # Milestone 1 PostgreSQL & Prisma integration suite
│   │   │   └── authSecurity.test.ts    # Milestone 2 JWT, RBAC & Security test suite
│   │   └── server.ts                   # Express server (Helmet, CORS, Cookie-parser, limits)
├── src/
│   ├── assets/                         # Static icons & logos
│   ├── components/
│   │   ├── admin/                      # 19 Admin & Operations management views
│   │   ├── client/                     # 11 Client society & facility head views
│   │   ├── technician/                 # 4 Field technician workflow views
│   │   ├── common/                     # 12 Shared modals (Login, QR, Feedback, Reports)
│   │   └── layout/                     # Header, Sidebar, Navbar navigation
│   ├── context/
│   │   └── AppContext.tsx              # Global state store & localStorage persistence
│   ├── data/
│   │   └── initialData.ts              # Seed & mock entity fixtures
│   ├── services/
│   │   └── api.ts                      # Fetch client, JWT Bearer auto-attachment, 401 refresh
│   ├── types/
│   │   └── index.ts                    # TypeScript types, interfaces, enums
│   ├── App.css                         # Custom styling & animations
│   ├── App.tsx                         # Main route & tab navigation controller
│   ├── index.css                       # Tailwind design system foundations
│   └── main.tsx                        # React 19 entrypoint
├── prisma/
│   ├── schema.prisma                   # 32 relational PostgreSQL models
│   └── seed.ts                         # Enterprise database seed script with bcrypt
├── public/                             # Public logos, icons, flowchart assets
├── docs/                               # Architecture, RBAC, and audit documentation
├── package.json                        # Root npm dependencies & scripts
├── tailwind.config.js                  # Tailwind UI theme & tokens
└── vite.config.ts                      # Vite build configuration
```

---

## 3. Application Execution & Endpoints

Both the Frontend and Backend servers are operational and verified:

* **Frontend Web Application:** [`http://localhost:5173`](http://localhost:5173) (Vite React 19 Dev Server)
* **Backend REST API Server:** [`http://localhost:5000`](http://localhost:5000) (Express Node.js Server)
* **Backend Health Check:** [`http://localhost:5000/api/health`](http://localhost:5000/api/health)
  * Returns: `{"status": "ok", "service": "WEPSUN Lift Service & AMC SaaS REST API", "version": "1.0.0"}`

---

## 4. Authentication & Security Verification

The real authentication system implemented in Milestone 2 was tested live against the running backend:

| Test Case | Method & Endpoint | Payload / Headers | Observed Response | Status |
|:---|:---|:---|:---|:---:|
| **Valid Login** | `POST /api/auth/login` | `admin@wepsun.com` / `Wepsun@2026` | `200 OK` — Returns user object, HS256 JWT access token (15m), and refresh token | ✅ PASS |
| **Invalid Password** | `POST /api/auth/login` | `admin@wepsun.com` / `WrongPass` | `401 Unauthorized` (`INVALID_CREDENTIALS`) | ✅ PASS |
| **Protected Route (Authenticated)** | `GET /api/auth/me` | `Authorization: Bearer <token>` | `200 OK` — Returns verified user profile & 20 permissions | ✅ PASS |
| **Protected Route (No Token)** | `GET /api/auth/me` | None | `401 Unauthorized` (`UNAUTHORIZED`) | ✅ PASS |
| **RBAC Super Admin Gate** | `GET /api/companies` | Company Admin Token | `403 Forbidden` (`FORBIDDEN_SUPER_ADMIN_ONLY`) | ✅ PASS |
| **Refresh Token Rotation** | `POST /api/auth/refresh` | `refreshToken` | `200 OK` — Issues rotated new access token & new refresh token | ✅ PASS |
| **Replay Attack Defense** | `POST /api/auth/refresh` | Re-used Old `refreshToken` | `401 Unauthorized` — Old token rejected and all user sessions revoked | ✅ PASS |

---

## 5. Role-by-Role Web Experience Audit

### 5.1 `SUPER_ADMIN`
* **Visible Navigation:** Overview Dashboard, Multi-Company Manager, Branches, Lifts Fleet, Breakdown Tickets, AMC & PM, Quotations, Invoices, Inventory Ledger, Technician Radar, Feedback Manager, Audit Logs, System Flowcharts, Design System Showcase.
* **Accessible Actions:** Create/Edit Companies, View Global Analytics across all tenants, Inspect System-wide Audit Logs.
* **Restricted Actions:** None.

### 5.2 `COMPANY_ADMIN`
* **Visible Navigation:** Operations Dashboard, Complaints Manager, Work Orders, AMC Contracts, Lift Directory, Quotations, Invoices & Payments, Inventory Manager, Technician Performance, Customer Feedback, Audit Logs.
* **Accessible Actions:** Assign technicians to breakdown tickets, approve quotations, dispatch work orders, adjust inventory, view audit logs for own company.
* **Restricted Pages:** `/api/companies` global directory (blocked with 403).

### 5.3 `SERVICE_MANAGER`
* **Visible Navigation:** Operations Dashboard, Complaints, Work Orders, Preventive Maintenance (PM), Lifts, Inventory, Technician Performance, GPS Radar.
* **Accessible Actions:** Dispatch technicians, set ETAs, approve PM schedules, manage stock movements.
* **Restricted Pages:** Audit Logs, Company creation, financial invoice deletion.

### 5.4 `TECHNICIAN`
* **Visible Navigation:** Technician Mobile Web Dashboard, Active Breakdown Jobs, PM Visit Schedules, AI Fault Assistant, Spare Parts Catalog.
* **Accessible Actions:** On-site GPS check-in, review lift breakdown history, run AI fault diagnostics, complete 4-zone PM checklists, generate digital service report, collect client digital signature, verify OTP.
* **Restricted Pages:** Financial quotations, invoices, user management, company settings.

### 5.5 `CLIENT` (Society Chairman / Facility Head)
* **Visible Navigation:** Client Society Dashboard, My Lifts, Lift Digital Passports, Raise Breakdown Ticket, 1-Click SOS Emergency, Complaint Live Tracker, Service History, AMC Contract, Quotation Approvals, Payment Invoices, Customer Feedback.
* **Accessible Actions:** Log breakdown ticket, trigger emergency SOS, track technician live arrival, view & download service reports, approve quotation proposals, pay AMC/repair invoices via UPI/Razorpay, rate technician performance.
* **Restricted Pages:** Back-office work orders, inventory purchase costs, technician radar tracking outside own assigned tickets, system audit logs.

### 5.6 `ACCOUNTS`
* **Visible Navigation:** Invoices & Billing, Payments Received, AMC Contracts, Quotations.
* **Accessible Actions:** Record offline payments (NEFT/RTGS/Cheque), generate invoices, track payment defaults.

### 5.7 `SALES`
* **Visible Navigation:** Quotations Manager, AMC Proposals, Customer Directory, Business Enquiries.
* **Accessible Actions:** Create estimates, send AMC proposals to society chairmen, track quotation conversions.

---

## 6. Field Technician Experience: Detailed Inspection

The current technician web interface (`src/components/technician/TechnicianDashboard.tsx`) was inspected against field workflow requirements:

| Feature / Screen | Current Implementation | Source File | Status |
|:---|:---|:---|:---:|
| **Assigned Jobs List** | Displays active breakdown cards with Priority badge (Critical/Normal), lift number, address, and issue description | `TechnicianDashboard.tsx` | ✅ Available |
| **GPS Site Arrival Check-In** | `checkInJob` logs current coordinates (`lat`, `lng`), distance from site, and updates ticket status | `AppContext.tsx` / `TechnicianDashboard.tsx` | ✅ Available |
| **Customer & Lift Details** | Displays building name, lift model, machine type, floors, last PM date | `TechnicianDashboard.tsx` | ✅ Available |
| **AI Fault Diagnostic Assistant** | Monarch, Schindler, Otis, Kone fault codes lookup with drive symptoms & remedies | `AiFaultAssistant.tsx` | ✅ Available |
| **PM 4-Zone Checklist Runner** | Interactive checklist for Machine Room, Car Top, Car Interior, Hoistway & Pit | `PmChecklistRunner.tsx` | ✅ Available |
| **Job Closure & Service Report** | Form capturing root cause, action taken, parts replaced, before/after photo URLs | `JobClosureModal.tsx` | ✅ Available |
| **Digital Customer Signature** | HTML5 Canvas touch/mouse signature pad | `DigitalSignaturePad.tsx` | ✅ Available |
| **Customer OTP Verification** | 4-digit OTP verification prompt before report completion | `OtpVerificationModal.tsx` | ✅ Available |
| **Offline Background Sync Queue** | Basic `localStorage` persistence exists; native offline SQLite/Workbox background sync queue is NOT implemented | `AppContext.tsx` | ⚠️ Web-Only |

---

## 7. Customer / Client Experience: Detailed Inspection

The customer portal (`src/components/client/ClientDashboard.tsx`) was inspected:

| Feature / Screen | Current Implementation | Source File | Status |
|:---|:---|:---|:---:|
| **Society Elevator Dashboard** | Real-time operational status of all society elevators (Running, In Maintenance, Breakdown) | `ClientDashboard.tsx` | ✅ Available |
| **Digital Lift Passport** | Modal displaying permanent lift ID, capacity, speed, controller brand, safety certificate expiry, QR code | `LiftPassportModal.tsx` | ✅ Available |
| **Raise Complaint Modal** | Category selection (Door jammed, jerky movement, abnormal noise, fan/light fault, levelling error) | `RaiseComplaintModal.tsx` | ✅ Available |
| **1-Click SOS Emergency** | Dedicated high-priority emergency breakdown trigger with sound alert | `RaiseComplaintModal.tsx` | ✅ Available |
| **Live Complaint Tracker** | 4-step progress stepper: `Logged` -> `Technician Assigned` -> `Inspection & Repair` -> `Resolved & Signed Off` | `ComplaintTracker.tsx` | ✅ Available |
| **AMC Contract Overview** | Displays contract number, comprehensive coverage inclusions/exclusions, PM visit counter (e.g. 9/12 visits done) | `ClientAmcView.tsx` | ✅ Available |
| **Quotation Review & Approval** | Approve/Reject spare part repair quotations with cost breakdown | `QuotationApprovalView.tsx` | ✅ Available |
| **Invoice Settlement** | Razorpay demo modal & UPI QR payment settlement | `ClientPaymentsView.tsx` | ✅ Available |
| **Post-Service Feedback** | 5-star rating (Punctuality, Technical Skill, Ride Smoothness, Communication) + tags + comment | `ClientFeedbackModal.tsx` | ✅ Available |
| **Public Feedback Form** | Dedicated standalone landing page (`#feedback-form`) for non-logged-in customers scanning lift QR | `PublicFeedbackPage.tsx` | ✅ Available |

---

## 8. Mobile Responsiveness & Viewport Inspection

The existing web application was analyzed across three standard viewport profiles:

### 8.1 Mobile Viewport (390 × 844 — iPhone 14/15 profile)
* **Header & Navigation:** The top header collapses into a compact mobile header with a hamburger drawer button and quick role switch.
* **Dashboard Layout:** 4-column metric cards stack into a single column.
* **Technician View:** Breakdown cards display in full-width single-column cards with large touch-friendly "Check-In" and "Start Job" buttons.
* **Client View:** Emergency SOS button remains prominently docked at the bottom right.
* **Modals:** Modals use `max-h-[92vh] overflow-y-auto` to prevent viewport cutoff on small screens.
* **Identified Mobile Quirks:**
  1. Wide data tables (e.g., Inventory Manager and Quotation Manager) require horizontal scrolling on narrow screens.
  2. Canvas signature pad touch coordinate offset requires touch event listeners alongside mouse events.
  3. No native push notifications (uses in-app toast notifications instead).

### 8.2 Tablet Viewport (768 × 1024 — iPad profile)
* **Layout:** Dual-column card layouts render cleanly.
* **Sidebar:** Collapsible sidebar operates smoothly.
* **Modals:** Centered dialogs render with optimal margins.

### 8.3 Desktop Viewport (1440 × 900)
* **Layout:** Full 4-column grid layout with persistent sidebar, dual-pane managers, and visual flowchart diagrams.

---

## 9. Mobile Strategy Classification

Based strictly on codebase evidence:

```
[ ] A: Native React Native / Expo mobile application exists.
[ ] B: Capacitor mobile application exists.
[ ] C: PWA / mobile web with service worker exists.
[X] D: Only responsive web UI exists.
[ ] E: Partial mobile implementation exists.
```

**Classification: D — Only responsive web UI exists.**

---

## 10. Mobile App Requirement Analysis (Target Native Separation)

When building dedicated mobile apps, the recommended architecture is to separate the workflows into two distinct mobile applications or a unified mobile app with role-based routing:

```
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│          CUSTOMER MOBILE APP           │       │         TECHNICIAN MOBILE APP          │
│       (Society Secretary / Head)       │       │        (Field Service Engineer)        │
├────────────────────────────────────────┤       ├────────────────────────────────────────┤
│ • Splash & Biometric/OTP Login         │       │ • Shift Attendance & Online Toggle     │
│ • Society Lifts & Digital Passports    │       │ • Assigned Breakdown Jobs Queue        │
│ • 1-Tap SOS Emergency Breakdown        │       │ • Native GPS Background Geofencing     │
│ • Live Technician Map Tracking (ETA)   │       │ • On-Site Proximity Check-In           │
│ • Service History & PDF Downloads      │       │ • Monarch/Schindler AI Diagnostic Hub  │
│ • AMC Status & Renewal Proposals       │       │ • 4-Zone PM Inspection Camera Scanner  │
│ • Quotation Review & One-Click Approve │       │ • Spare Parts Consumption Logger       │
│ • UPI / Card Payment Settlement        │       │ • Customer Digital Signature Pad       │
│ • Star Rating & Verified Review Submit │       │ • Customer Sign-off OTP Verification   │
│ • Native Push Notifications (FCM/APNs) │       │ • Offline-First SQLite Sync Engine     │
└────────────────────────────────────────┘       └────────────────────────────────────────┘
```

---

## 11. Backend API Sharing Architecture

Both the Web Application and future Mobile Applications can share the **exact same Express backend and PostgreSQL database**:

```
                       ┌──────────────────────────────────────────┐
                       │   Unified Backend Infrastructure         │
                       │   Node.js + Express + Prisma ORM         │
                       └────────────────────┬─────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │      Web Applications       │                 │     Native Mobile Apps      │
     │  (Admin, Client, Public)    │                 │    (Client & Technician)    │
     ├─────────────────────────────┤                 ├─────────────────────────────┤
     │ • Bearer JWT in Storage     │                 │ • Bearer JWT in SecureStore │
     │ • Responsive Web UI         │                 │ • Native Camera / QR        │
     │ • Toast Notifications       │                 │ • Native Background GPS     │
     │ • Browser PDF Render        │                 │ • Push Notifications (FCM)  │
     └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## 12. UI Quality & Identified Quirks

1. **Wide Data Tables on Mobile:** `InventoryManager.tsx` and `QuotationManager.tsx` have 8+ columns that require horizontal panning on 390px mobile screens.
2. **Signature Canvas Coordinate Scaling:** On high-DPI retina mobile screens, the HTML5 canvas in `DigitalSignaturePad.tsx` needs DPR scaling to avoid jagged strokes.
3. **Floating Header Z-Index:** When opening the `RaiseComplaintModal.tsx`, the floating mobile role switcher in certain scroll positions can overlap with modal backdrop.
4. **Hardcoded Initial Mock Datasets in Context:** `AppContext.tsx` still initializes from `src/data/initialData.ts` and persists to `localStorage` when backend API is offline.

---

## 13. Database & API Connectivity Mapping

| UI Feature / Component | File Path | Current State in App | Expected Production API Route |
|:---|:---|:---|:---|
| **Authentication & Tokens** | `src/components/common/LoginModal.tsx` | Connected to Live API | `POST /api/auth/login` |
| **Token Refresh Loop** | `src/services/api.ts` | Connected to Live API | `POST /api/auth/refresh` |
| **Elevator Fleet** | `src/components/admin/LiftDirectory.tsx` | `AppContext.tsx` (localStorage) | `GET /api/lifts` |
| **Complaints & Tickets** | `src/components/admin/ComplaintManager.tsx` | `AppContext.tsx` (localStorage) | `GET /api/complaints` |
| **Work Orders** | `src/components/admin/WorkOrderManager.tsx` | `AppContext.tsx` (localStorage) | `GET /api/work-orders` |
| **Inventory Ledger** | `src/components/admin/InventoryManager.tsx` | `AppContext.tsx` (localStorage) | `GET /api/inventory` |
| **AMC Contracts** | `src/components/admin/AmcManager.tsx` | `AppContext.tsx` (localStorage) | `GET /api/amc` |
| **Quotations** | `src/components/admin/QuotationManager.tsx` | `AppContext.tsx` (localStorage) | `GET /api/quotations` |
| **Customer Feedback** | `src/components/admin/CustomerFeedbackManager.tsx`| `AppContext.tsx` (localStorage) | `GET /api/feedback` |
| **Audit Logs** | `src/components/admin/AuditLogViewer.tsx` | `AppContext.tsx` (localStorage) | `GET /api/audit` |

---

## 14. Test Accounts & Credentials

The seed data provides accounts for testing every role:

| Role | Email | Password | Assigned Entity |
|:---|:---|:---|:---|
| **SUPER_ADMIN** | `superadmin@wepsun.com` | `Wepsun@2026` | Global Multi-Company Platform |
| **COMPANY_ADMIN** | `admin@wepsun.com` | `Wepsun@2026` | WEPSUN Engineering Solution Pvt. Ltd. |
| **SERVICE_MANAGER** | `service.manager@wepsun.com` | `Wepsun@2026` | Mumbai Central & Western Branch |
| **TECHNICIAN** | `rajesh.sharma@wepsun.com` | `Wepsun@2026` | Pune West Rapid Response Unit |
| **CLIENT** | `client@greenwood.com` | `Wepsun@2026` | Greenwood Heights Co-op Housing Society |
| **ACCOUNTS** | `accounts@wepsun.com` | `Wepsun@2026` | Finance & Invoicing Dept |
| **SALES** | `sales@wepsun.com` | `Wepsun@2026` | Commercial Proposals Dept |

---

## 15. Summary & Recommended Next Steps

1. **Current State:**
   * **Web:** Full-featured, responsive, multi-role web platform covering Admin, Client, Technician, and Public Feedback workflows.
   * **Auth/Backend:** Real JWT authentication, password hashing, session rotation, RBAC, and multi-tenant schema with 33/33 tests passing.
   * **Mobile:** No native mobile project currently exists.
2. **Recommended Next Phase:**
   * **Option A (Milestone 3 — Production Cloud Storage & Real-Time Sync):** Wire up cloud file/photo storage (S3/Cloudinary), live WebSockets for technician GPS and dispatch alerts, and full frontend-to-API state hydration.
   * **Option B (Native Mobile App Scaffolding):** Initialize a dedicated React Native / Expo or Capacitor mobile application for Field Technicians and Clients sharing the existing backend REST API.
