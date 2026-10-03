# WEPSUN Engineering Solutions
## User Roles & Role-Based Access Control (RBAC) Specification

---

## 1. System Roles Overview

The platform enforces strict role-based access control across all 3 client interfaces and backend endpoints:

1. **`SUPER_ADMIN`**: Global platform administrator. Manages multi-tenant companies, system-wide configuration, and global audit logs.
2. **`ADMIN` / `COMPANY_ADMIN`**: Enterprise administrator for WEPSUN Engineering Solutions. Full administrative authority over all operational modules.
3. **`SERVICE_MANAGER`**: Oversees field service operations, technician dispatches, breakdown escalation queues, and quality scores.
4. **`TECHNICIAN`**: Field service engineer. Accesses assigned jobs, GPS routes, PM safety checklists, spare parts consumption, and digital signatures.
5. **`CUSTOMER`**: Building secretary, chairman, or facility manager. Views registered lifts, raises complaints, tracks AMC contracts, approves quotations, and pays invoices.
6. **`ACCOUNTANT`**: Financial officer. Manages invoices, GST ledgers, payment reconciliations, and quotation costings.
7. **`INVENTORY_MANAGER`**: Warehouse coordinator. Manages spare parts catalog, minimum stock reorder alerts, supplier purchase orders, and technician issuance.

---

## 2. Comprehensive RBAC Permissions Matrix

| Module | SUPER_ADMIN | ADMIN | SERVICE_MANAGER | TECHNICIAN | CUSTOMER | ACCOUNTANT | INVENTORY_MGR |
|---|---|---|---|---|---|---|---|
| **User & Staff Mgmt** | Full | Full | Read/Assign | Read Self | Read Self | Read | Read |
| **Lift Asset Registry** | Full | Full | Full | Read/Inspect | Read (Owned) | Read | Read |
| **Breakdown Complaints** | Full | Full | Full (Dispatch) | Update Assigned | Create/Track Own | Read | Read |
| **Service Visits & Jobs** | Full | Full | Full | Execute Assigned | View Completed | Read | Read |
| **Service Reports & PDF**| Full | Full | Full | Create/Sign | View/Download Own | Read | Read |
| **Preventive Maintenance**| Full | Full | Full | Execute Assigned | View Schedule | Read | Read |
| **AMC Contracts** | Full | Full | Full | Read Scope | View/Renew Own | Read/Invoice | Read |
| **Quotations** | Full | Full | Full | Request Parts | View/Approve Own | Full | Read |
| **Invoices & Billing** | Full | Full | Read | No Access | View/Pay Own | Full | Read |
| **Online Payments (Razorpay)**| Full | Full | Read | No Access | Pay Own | Full | Read |
| **Spare Parts & Stock** | Full | Full | Read | Issue for Job | No Access | Read | Full |
| **Customer Feedback & CSAT**| Full | Full | Full (Reply) | Read Leaderboard | Submit Own | Read | Read |
| **Push Notifications** | Full | Full | Trigger Dispatch | Receive | Receive | Receive | Receive |
| **Audit Logs** | Full | Full | View Ops Logs | No Access | No Access | View Financial | View Stock Logs |
| **System Settings** | Full | Full | Read | No Access | No Access | Read | Read |

---

## 3. Backend Authorization Enforcement

Authorization is enforced at three distinct layers:
1. **Route Guard Level (`@Roles(...)` / `roleGuard.ts`)**: Rejects unprivileged requests at the HTTP gateway before executing controller methods.
2. **Tenant Scoping (`tenantScopeMiddleware.ts`)**: Guarantees that query filters automatically constrain `where: { companyId: req.user.companyId }`.
3. **Entity Ownership Check**: For `CUSTOMER` role, queries automatically inject `where: { customerId: req.user.customerId }` or `buildingId: { in: req.user.authorizedBuildingIds }`.
