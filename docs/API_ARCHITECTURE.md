# WEPSUN Engineering Solutions
## API Architecture & REST Specification
### Enterprise REST API Specification (OpenAPI 3.0 Compatible)

---

## 1. Global API Standards & Envelope

All API endpoints strictly follow the uniform JSON envelope design:

### 1.1 Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "cmp_8492021",
    "ticketNumber": "CMP-2026-0416",
    "status": "IN_PROGRESS",
    "createdAt": "2026-09-21T10:30:00.000Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 142
  }
}
```

### 1.2 Error Response (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "message": "Lift is currently undergoing active emergency repair.",
  "code": "LIFT_LOCKED_BREAKDOWN",
  "details": {
    "activeTicketId": "CMP-2026-0416"
  }
}
```

---

## 2. API Security & Middleware Pipeline

```mermaid
graph LR
    REQ[HTTP Request] --> CORS[CORS Middleware]
    CORS --> RATE[Rate Limiter (Redis Token Bucket)]
    RATE --> AUTH[AuthGuard: Bearer JWT Extraction]
    AUTH --> TENANT[TenantScopeMiddleware: Org & Branch Injection]
    TENANT --> ROLE[RoleGuard: RBAC Permission Evaluation]
    ROLE --> PIPE[ValidationPipe: Zod / Class Validator]
    PIPE --> HANDLER[Module Controller & Service]
    HANDLER --> AUDIT[AuditLoggingInterceptor]
    AUDIT --> RESP[HTTP Response]
```

---

## 3. Complete Module REST Endpoints Matrix

### 3.1 Authentication & Profile (`/api/auth`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/api/auth/login` | Email/Phone + Password or OTP login | Public |
| `POST` | `/api/auth/register` | Client self-registration / onboarding | Public |
| `POST` | `/api/auth/refresh` | Rotate JWT Access Token using Refresh Cookie | Authenticated |
| `POST` | `/api/auth/logout` | Revoke active refresh session | Authenticated |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions | Authenticated |
| `POST` | `/api/auth/forgot-password` | Send password reset token via SMS/Email | Public |

### 3.2 Lifts & Elevator Assets (`/api/lifts`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/lifts` | List registered lifts with filtering | All Roles |
| `POST` | `/api/lifts` | Register new lift unit & generate QR code | Admin, Service Manager |
| `GET` | `/api/lifts/:id` | Get lift technical details, AMC & service history | All Roles |
| `PUT` | `/api/lifts/:id` | Update lift specifications or status | Admin, Service Manager |
| `GET` | `/api/lifts/qr/:token` | Public Digital Elevator Passport lookup | Public / All |

### 3.3 Breakdown Complaints (`/api/complaints`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/complaints` | Paginated complaint registry with filter by status/priority | All Roles |
| `POST` | `/api/complaints` | Raise breakdown ticket with photos & issue category | Customer, Admin |
| `GET` | `/api/complaints/:id` | Get complaint details, timeline, and chat log | All Roles |
| `PATCH` | `/api/complaints/:id/status` | Advance ticket status (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`) | Tech, Admin |
| `POST` | `/api/complaints/:id/assign` | Dispatch service engineer to complaint | Admin, Service Manager |
| `POST` | `/api/complaints/:id/comments` | Post update note or customer comment | All Roles |

### 3.4 Service Visits & Reports (`/api/service-visits`, `/api/service-reports`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/service-visits/my-jobs` | List technician's active assignments | Technician |
| `PATCH` | `/api/service-visits/:id/stage` | Update stage: `ACCEPTED` → `TRAVELING` → `ARRIVED` | Technician |
| `POST` | `/api/service-reports` | Submit digital job card with checklist & signatures | Technician |
| `GET` | `/api/service-reports/:id/pdf` | Stream or download official signed PDF service report | All Roles |

### 3.5 AMC & Preventive Maintenance (`/api/amc`, `/api/pm`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/amc` | List active contracts, renewals, and expiring list | Admin, Customer |
| `POST` | `/api/amc` | Create new AMC contract and generate payment schedule | Admin |
| `GET` | `/api/pm/schedules` | Get calendar of upcoming preventive maintenance visits | All Roles |
| `POST` | `/api/pm/complete` | Record 4-zone safety checklist inspection | Technician |

### 3.6 Quotations, Invoices & Payments (`/api/quotations`, `/api/invoices`, `/api/payments`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/quotations` | List quotations with draft/sent/approved filter | Admin, Customer |
| `POST` | `/api/quotations` | Create itemized estimate for parts & modernization | Admin |
| `POST` | `/api/quotations/:id/approve` | Customer approves estimate → auto-generates invoice | Customer, Admin |
| `GET` | `/api/invoices` | List invoices and payment ledgers | Admin, Customer, Accountant |
| `POST` | `/api/payments/razorpay/create-order` | Generate Razorpay Order ID for online settlement | Customer |
| `POST` | `/api/payments/razorpay/verify` | Verify Razorpay payment signature & update invoice | Public (Webhook) / Customer |

### 3.7 Spare Parts Inventory (`/api/inventory`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/inventory` | List spare parts with low-stock indicators | Admin, Inventory Mgr |
| `POST` | `/api/inventory/transactions` | Record stock in, stock out, or job consumption | Admin, Inventory Mgr, Tech |

### 3.8 Customer Feedback & Ratings (`/api/feedback`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/feedback` | Query CSAT index, reviews, and leaderboard | Admin, Service Manager |
| `POST` | `/api/feedback/submit` | Submit review from Customer App or Public Link | Public / Customer |
| `POST` | `/api/feedback/:id/reply` | Official OEM response to customer review | Admin, Service Manager |
| `POST` | `/api/feedback/:id/resolve` | Mark low-rating case resolved after manager callback | Admin |
