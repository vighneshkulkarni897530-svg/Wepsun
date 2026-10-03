# WEPSUN Engineering Solutions
## Database Architecture & Entity-Relationship (ER) Specification
### Relational Schema Design for PostgreSQL 16 (Prisma ORM)

---

## 1. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    %% Core Users & RBAC
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : contains
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : defined_by
    USERS ||--o{ CUSTOMERS : profiles_as
    USERS ||--o{ TECHNICIANS : profiles_as
    USERS ||--o{ ADMINS : profiles_as
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ NOTIFICATIONS : receives

    %% Buildings, Sites & Lift Assets
    SITES ||--o{ BUILDINGS : contains
    CUSTOMERS ||--o{ BUILDINGS : owns_or_manages
    BUILDINGS ||--o{ LIFTS : houses
    LIFTS ||--o{ LIFT_COMPONENTS : configured_with
    LIFTS ||--o{ DOCUMENTS : has_attached

    %% AMC Contracts & PM
    AMC_PLANS ||--o{ AMC_CONTRACTS : templates
    CUSTOMERS ||--o{ AMC_CONTRACTS : signs
    AMC_CONTRACTS ||--o{ LIFTS : covers
    AMC_CONTRACTS ||--o{ MAINTENANCE_SCHEDULES : governs
    LIFTS ||--o{ PREVENTIVE_MAINTENANCE : undergoes
    MAINTENANCE_SCHEDULES ||--o{ PREVENTIVE_MAINTENANCE : generates

    %% Breakdown Complaints & Lifecycle
    CUSTOMERS ||--o{ COMPLAINTS : raises
    LIFTS ||--o{ COMPLAINTS : experiences
    COMPLAINTS ||--o{ COMPLAINT_COMMENTS : receives
    COMPLAINTS ||--o{ COMPLAINT_ATTACHMENTS : contains
    COMPLAINTS ||--o{ TECHNICIAN_ASSIGNMENTS : assigned_via

    %% Service Visits & Digital Job Cards
    COMPLAINTS ||--o{ SERVICE_REQUESTS : initiates
    PREVENTIVE_MAINTENANCE ||--o{ SERVICE_REQUESTS : initiates
    SERVICE_REQUESTS ||--o{ SERVICE_VISITS : creates
    TECHNICIANS ||--o{ SERVICE_VISITS : executes
    SERVICE_VISITS ||--o{ SERVICE_REPORTS : documents
    SERVICE_REPORTS ||--o{ DOCUMENTS : archives_as

    %% Quotations & Invoicing & Payments
    CUSTOMERS ||--o{ QUOTATIONS : requested_for
    LIFTS ||--o{ QUOTATIONS : references
    QUOTATIONS ||--o{ QUOTATION_ITEMS : itemizes
    QUOTATIONS ||--o{ INVOICES : converts_to
    AMC_CONTRACTS ||--o{ INVOICES : bills
    INVOICES ||--o{ PAYMENTS : settles

    %% Spare Parts & Inventory
    INVENTORY_ITEMS ||--o{ INVENTORY_TRANSACTIONS : records
    SPARE_PARTS ||--o{ INVENTORY_ITEMS : classified_under
    SERVICE_REPORTS ||--o{ INVENTORY_TRANSACTIONS : consumes_parts

    %% System Configuration
    SYSTEM_SETTINGS {
        string key PK
        string value
        string category
        datetime updated_at
    }

    USERS {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        string full_name
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    ROLES {
        string id PK
        string name UK
        string description
    }

    PERMISSIONS {
        string id PK
        string module
        string action
        string description
    }

    CUSTOMERS {
        uuid id PK
        uuid user_id FK
        string company_name
        string billing_address
        string gst_number
        string contact_person
        datetime created_at
    }

    TECHNICIANS {
        uuid id PK
        uuid user_id FK
        string employee_code UK
        string skill_level
        string zone_assigned
        float current_latitude
        float current_longitude
        boolean is_available
        datetime created_at
    }

    BUILDINGS {
        uuid id PK
        uuid customer_id FK
        string name
        string address
        string city
        string state
        string pincode
        datetime created_at
    }

    LIFTS {
        uuid id PK
        uuid building_id FK
        string lift_number UK
        string serial_number UK
        string manufacturer
        string model
        int capacity_persons
        float capacity_kg
        int floor_stops
        string drive_type
        string current_status
        string qr_token UK
        date installation_date
        datetime created_at
    }

    AMC_CONTRACTS {
        uuid id PK
        uuid customer_id FK
        string contract_number UK
        uuid plan_id FK
        date start_date
        date end_date
        decimal annual_value
        string payment_frequency
        string status
        datetime created_at
    }

    COMPLAINTS {
        uuid id PK
        uuid lift_id FK
        uuid customer_id FK
        string ticket_number UK
        string issue_type
        string priority
        string status
        text description
        datetime resolved_at
        datetime created_at
    }

    SERVICE_VISITS {
        uuid id PK
        uuid technician_id FK
        string visit_type
        string current_stage
        datetime scheduled_at
        datetime accepted_at
        datetime arrived_at
        datetime completed_at
    }

    SERVICE_REPORTS {
        uuid id PK
        uuid service_visit_id FK
        string report_number UK
        json inspection_checklist
        text work_performed
        text safety_observations
        string technician_signature_url
        string customer_signature_url
        string pdf_url
        float customer_rating
        datetime created_at
    }

    INVOICES {
        uuid id PK
        uuid customer_id FK
        string invoice_number UK
        decimal subtotal
        decimal tax_amount
        decimal grand_total
        string payment_status
        date due_date
        datetime created_at
    }

    PAYMENTS {
        uuid id PK
        uuid invoice_id FK
        string razorpay_payment_id UK
        string razorpay_order_id
        decimal amount
        string status
        string payment_method
        datetime paid_at
    }

    INVENTORY_ITEMS {
        uuid id PK
        string part_number UK
        string name
        string category
        int quantity_on_hand
        int min_reorder_level
        decimal unit_cost
        string warehouse_bin
        datetime updated_at
    }
```

---

## 2. Key Architectural Constraints & Optimizations

1. **Multi-Tenancy & Scoping**:
   - Every operational entity (`LIFTS`, `BUILDINGS`, `COMPLAINTS`, `INVENTORY`, `INVOICES`) belongs directly to a company/tenant ID with PostgreSQL row-level indexing.
2. **High-Performance Query Indexing**:
   - Composite index on `COMPLAINTS(lift_id, status, priority)`.
   - Index on `TECHNICIANS(is_available, zone_assigned)`.
   - Index on `PREVENTIVE_MAINTENANCE(next_due_date, status)`.
   - Unique constraints on `LIFTS.qr_token`, `COMPLAINTS.ticket_number`, `INVOICES.invoice_number`.
3. **Audit & Soft Deletion**:
   - All core tables feature `deleted_at TIMESTAMP NULL` for regulatory compliance in elevator safety inspections.
   - Any state change triggers an asynchronous audit event into `AUDIT_LOGS`.
