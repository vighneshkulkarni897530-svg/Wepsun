-- ============================================================================
-- WEPSUN Engineering Solutions — Enterprise PostgreSQL Row-Level Security (RLS)
-- Production Deployment Script for Supabase PostgreSQL 15/16
-- 
-- Objectives:
-- 1. Enforce strict Multi-Tenant isolation (company_id).
-- 2. Grant full bypass to backend Prisma / service_role / postgres connections.
-- 3. Enforce Role-Based Access Control (RBAC) for direct Supabase client access:
--    - Super Admin & Company Admin: Full tenant-scoped management
--    - Technician: Assigned job access, service report creation, inventory issue
--    - Client: Self-scoped equipment, complaint registration, and invoices
-- 4. Audit Log Immutability: Append-only enforcement (No UPDATE or DELETE permitted).
-- ============================================================================

-- Helper: Enable RLS on all WEPSUN schema tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'companies',
        'branches',
        'users',
        'clients',
        'technicians',
        'lifts',
        'buildings',
        'complaints',
        'complaint_timelines',
        'service_reports',
        'amc_contracts',
        'quotations',
        'work_orders',
        'invoices',
        'payments',
        'inventory_parts',
        'inventory_movements',
        'customer_feedbacks',
        'notifications',
        'audit_logs',
        'system_settings',
        'user_sessions',
        'password_reset_tokens',
        'session_rotations'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            
            -- Grant full access to internal backend service_role & postgres roles
            EXECUTE format('DROP POLICY IF EXISTS "service_role_bypass" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "service_role_bypass" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
            
            EXECUTE format('DROP POLICY IF EXISTS "postgres_bypass" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "postgres_bypass" ON public.%I FOR ALL TO postgres USING (true) WITH CHECK (true);', tbl);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 1. COMPANIES & BRANCHES
-- ============================================================================
DROP POLICY IF EXISTS "tenant_company_read" ON public.companies;
CREATE POLICY "tenant_company_read" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id = (auth.jwt() ->> 'companyId')::text
        OR (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'MASTER_ADMIN')
    );

DROP POLICY IF EXISTS "tenant_branch_read" ON public.branches;
CREATE POLICY "tenant_branch_read" ON public.branches
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        OR (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'MASTER_ADMIN')
    );

-- ============================================================================
-- 2. LIFTS & BUILDINGS (CLIENT & TECH ISOLATION)
-- ============================================================================
DROP POLICY IF EXISTS "tenant_lifts_read" ON public.lifts;
CREATE POLICY "tenant_lifts_read" ON public.lifts
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN')
            OR client_id = (auth.jwt() ->> 'clientId')::text
        )
    );

DROP POLICY IF EXISTS "admin_lifts_modify" ON public.lifts;
CREATE POLICY "admin_lifts_modify" ON public.lifts
    FOR ALL TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER')
    )
    WITH CHECK (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER')
    );

DROP POLICY IF EXISTS "tenant_buildings_read" ON public.buildings;
CREATE POLICY "tenant_buildings_read" ON public.buildings
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN')
            OR client_id = (auth.jwt() ->> 'clientId')::text
        )
    );

-- ============================================================================
-- 3. COMPLAINTS & EMERGENCY BREAKDOWN SYSTEM
-- ============================================================================
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
CREATE POLICY "complaints_select_policy" ON public.complaints
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'MASTER_ADMIN')
            OR (
                (auth.jwt() ->> 'role') = 'TECHNICIAN'
                AND (assigned_technician_id = (auth.jwt() ->> 'technicianId')::text OR assigned_technician_id IS NULL)
            )
            OR (
                (auth.jwt() ->> 'role') = 'CLIENT'
                AND (client_id = (auth.jwt() ->> 'clientId')::text OR created_by_id = auth.uid()::text)
            )
        )
    );

DROP POLICY IF EXISTS "complaints_insert_policy" ON public.complaints;
CREATE POLICY "complaints_insert_policy" ON public.complaints
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = (auth.jwt() ->> 'companyId')::text
    );

DROP POLICY IF EXISTS "complaints_update_policy" ON public.complaints;
CREATE POLICY "complaints_update_policy" ON public.complaints
    FOR UPDATE TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'MASTER_ADMIN')
            OR (
                (auth.jwt() ->> 'role') = 'TECHNICIAN'
                AND assigned_technician_id = (auth.jwt() ->> 'technicianId')::text
            )
            OR (
                (auth.jwt() ->> 'role') = 'CLIENT'
                AND (client_id = (auth.jwt() ->> 'clientId')::text OR created_by_id = auth.uid()::text)
            )
        )
    );

-- ============================================================================
-- 4. SERVICE REPORTS
-- ============================================================================
DROP POLICY IF EXISTS "service_reports_select_policy" ON public.service_reports;
CREATE POLICY "service_reports_select_policy" ON public.service_reports
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'MASTER_ADMIN')
            OR technician_id = (auth.jwt() ->> 'technicianId')::text
            OR client_id = (auth.jwt() ->> 'clientId')::text
        )
    );

DROP POLICY IF EXISTS "service_reports_insert_policy" ON public.service_reports;
CREATE POLICY "service_reports_insert_policy" ON public.service_reports
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN')
    );

-- ============================================================================
-- 5. INVOICES, AMC CONTRACTS & PAYMENTS
-- ============================================================================
DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
CREATE POLICY "invoices_select_policy" ON public.invoices
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'ACCOUNTS', 'SERVICE_MANAGER')
            OR client_id = (auth.jwt() ->> 'clientId')::text
        )
    );

DROP POLICY IF EXISTS "amc_select_policy" ON public.amc_contracts;
CREATE POLICY "amc_select_policy" ON public.amc_contracts
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (
            (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'SALES')
            OR client_id = (auth.jwt() ->> 'clientId')::text
        )
    );

-- ============================================================================
-- 6. INVENTORY & SPARE PARTS
-- ============================================================================
DROP POLICY IF EXISTS "inventory_select_policy" ON public.inventory_parts;
CREATE POLICY "inventory_select_policy" ON public.inventory_parts
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
    );

DROP POLICY IF EXISTS "inventory_movement_insert_policy" ON public.inventory_movements;
CREATE POLICY "inventory_movement_insert_policy" ON public.inventory_movements
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN')
    );

-- ============================================================================
-- 7. AUDIT LOGS — STRICT IMMUTABILITY ENFORCEMENT
-- ============================================================================
-- Read: Only Admins can view audit logs
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        company_id = (auth.jwt() ->> 'companyId')::text
        AND (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN')
    );

-- Insert: Backend service_role and authenticated users can append audit logs
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = (auth.jwt() ->> 'companyId')::text
    );

-- UPDATE PROHIBITED: Explicit rejection of any UPDATE on audit_logs
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
CREATE POLICY "audit_logs_no_update" ON public.audit_logs
    FOR UPDATE TO authenticated
    USING (false)
    WITH CHECK (false);

-- DELETE PROHIBITED: Explicit rejection of any DELETE on audit_logs
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
    FOR DELETE TO authenticated
    USING (false);

-- ============================================================================
-- 8. COMPOSITE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_company_emergency_status ON public.complaints (company_id, is_emergency, status);
CREATE INDEX IF NOT EXISTS idx_complaints_company_reported_at ON public.complaints (company_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_lift_status ON public.complaints (lift_id, status);

CREATE INDEX IF NOT EXISTS idx_lifts_building ON public.lifts (building_id);
CREATE INDEX IF NOT EXISTS idx_lifts_client ON public.lifts (client_id);
CREATE INDEX IF NOT EXISTS idx_lifts_status ON public.lifts (current_status);
CREATE INDEX IF NOT EXISTS idx_lifts_amc_status ON public.lifts (amc_status);

CREATE INDEX IF NOT EXISTS idx_amc_company_client_status ON public.amc_contracts (company_id, client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_company_client_status ON public.invoices (company_id, client_id, status);

CREATE INDEX IF NOT EXISTS idx_inventory_company_threshold ON public.inventory_parts (company_id, current_stock, min_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_service_reports_company_tech_date ON public.service_reports (company_id, technician_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_entity ON public.audit_logs (company_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_timestamp ON public.audit_logs (company_id, timestamp DESC);
