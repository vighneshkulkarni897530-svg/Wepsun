# WEPSUN Engineering Solutions
## Folder Structure & Monorepo Layout Specification

---

## 1. Monorepo Organization

```text
wepsun-platform/
│
├── .env.example                       # Production environment template
├── README.md                          # Platform setup & development guide
├── package.json                       # Monorepo root scripts (dev, build, lint, test)
│
├── apps/                              # Front-end applications
│   ├── admin/                         # Next.js 14+ / React Admin Portal (Desktop/Tablet)
│   │   ├── public/                    # Assets, logos, SVG diagrams
│   │   ├── src/
│   │   │   ├── app/                   # App Router / Pages
│   │   │   │   ├── (auth)/            # Login, Forgot Password, Reset
│   │   │   │   ├── dashboard/         # Executive Overview & Stats
│   │   │   │   ├── complaints/        # Breakdown Tickets, SLA tracker, Dispatch
│   │   │   │   ├── lifts/             # Lift Directory, QR Passport Generator
│   │   │   │   ├── amc/               # Contracts, Renewals, Expiry Alarms
│   │   │   │   ├── pm/                # Preventive Maintenance Schedules & Safety Checklist
│   │   │   │   ├── technicians/       # Live Radar, GPS check-in, performance
│   │   │   │   ├── quotations/        # Itemized Estimates, Approval workflow
│   │   │   │   ├── invoices/          # Invoices, GST Ledgers, Collections
│   │   │   │   ├── inventory/         # Spare Parts, Reorder Level, Stock Ledger
│   │   │   │   ├── feedback/          # CSAT index, reviews, public rating link
│   │   │   │   ├── reports/           # Analytics, Export PDF/Excel
│   │   │   │   ├── audit-logs/        # Regulatory change history
│   │   │   │   └── settings/          # System preferences & tenant profile
│   │   │   ├── components/            # Reusable UI widgets, Modals, Tables, Charts
│   │   │   ├── hooks/                 # Custom TanStack Query hooks
│   │   │   ├── lib/                   # API clients, axios instance, formatters
│   │   │   └── types/                 # Frontend interfaces
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   ├── customer-mobile/               # React Native / Expo Customer App (iOS & Android)
│   │   ├── src/
│   │   │   ├── navigation/            # Role-based Tab & Stack Navigators
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.tsx     # Overview, SOS button, active AMC, open tickets
│   │   │   │   ├── MyLiftsScreen.tsx  # Registered lift cards & digital passports
│   │   │   │   ├── RaiseComplaint.tsx # Photo upload, issue selector, emergency toggle
│   │   │   │   ├── ComplaintTrack.tsx # Real-time technician ETA & status tracking
│   │   │   │   ├── AmcScreen.tsx      # Contract details, renewal alerts
│   │   │   │   ├── ServiceHistory.tsx # Past repairs, PDF reports, ratings
│   │   │   │   └── PaymentsScreen.tsx # Pending bills & Razorpay checkout
│   │   │   ├── components/
│   │   │   ├── services/              # API Client & Firebase Push Listeners
│   │   │   └── store/                 # Local Auth & Cache
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── technician-mobile/             # React Native / Expo Field Engineer App
│       ├── src/
│       │   ├── navigation/            # Technician Navigators
│       │   ├── screens/
│       │   │   ├── JobQueueScreen.tsx # Today's assigned breakdowns & PM visits
│       │   │   ├── JobDetails.tsx     # Customer info, GPS navigation, lift specs
│       │   │   ├── JobWorkflow.tsx    # Travel → Arrive → Inspect → Work in Progress
│       │   │   ├── PmChecklist.tsx    # 4-Zone mandatory safety checklist
│       │   │   ├── PartsUsed.tsx      # Issue spare parts from mobile inventory
│       │   │   ├── SignOffScreen.tsx  # Customer digital signature on glass
│       │   │   └── ServiceReport.tsx  # Generated PDF view & share
│       │   ├── offline/               # Local SQLite cache & sync engine
│       │   └── services/              # GPS Check-in & Background Geo-tracker
│       ├── app.json
│       └── package.json
│
├── backend/                           # Node.js REST API Server
│   ├── src/
│   │   ├── config/                    # Environment, Database, JWT, Razorpay, FCM, S3
│   │   ├── database/                  # Prisma client singleton
│   │   ├── middleware/                # CORS, Tenant Scope, Rate Limiter, Error Handler
│   │   ├── guards/                    # RoleGuard, AuthGuard
│   │   ├── modules/                   # Modular Clean Architecture
│   │   │   ├── auth/                  # Auth controller, service, JWT strategy, DTOs
│   │   │   ├── users/                 # User CRUD & role assignments
│   │   │   ├── customers/             # Customer directory & buildings
│   │   │   ├── technicians/           # Technician assignments, GPS logs, ratings
│   │   │   ├── lifts/                 # Lift registry, QR tokens, specs
│   │   │   ├── complaints/            # Breakdown ticketing, SLAs, timeline
│   │   │   ├── service-visits/        # Field visits, stage progression
│   │   │   ├── service-reports/       # Digital job cards & PDF generator
│   │   │   ├── amc/                   # Contracts, renewal cron, SLA policies
│   │   │   ├── pm/                    # Preventive maintenance scheduler & checklists
│   │   │   ├── quotations/            # Itemized estimates & invoice conversions
│   │   │   ├── invoices/              # Invoicing, GST calculations, ledger
│   │   │   ├── payments/              # Razorpay orders, webhooks, verification
│   │   │   ├── inventory/             # Spare parts stock, movements, bin locations
│   │   │   ├── feedback/              # Customer reviews, CSAT scores, public link
│   │   │   ├── notifications/         # FCM push sender, WhatsApp & SMS dispatchers
│   │   │   ├── reports/               # Executive analytics, CSV/Excel export
│   │   │   └── audit/                 # Audit logging interceptor & viewer
│   │   ├── jobs/                      # Cron workers (daily PM generation, AMC expiry)
│   │   ├── utils/                     # PDF builder, QR code generator, geo-helpers
│   │   └── server.ts                  # Express / Fastify / NestJS application entrypoint
│   ├── tsconfig.json
│   └── package.json
│
├── packages/                          # Shared Monorepo Packages
│   ├── types/                         # Shared TypeScript interfaces & enums
│   ├── validation/                    # Shared Zod / class-validator schemas
│   └── api-client/                    # Axios API client SDK
│
├── database/                          # PostgreSQL Migrations & Seeding
│   ├── schema.prisma                  # Master Prisma ORM schema
│   ├── migrations/                    # SQL migrations
│   └── seed.ts                        # Master seed dataset
│
└── docs/                              # Architecture Documentation
    ├── SYSTEM_ARCHITECTURE.md
    ├── DATABASE_ER_DIAGRAM.md
    ├── API_ARCHITECTURE.md
    ├── USER_ROLES_RBAC.md
    └── FOLDER_STRUCTURE.md
```
