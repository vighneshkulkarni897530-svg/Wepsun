# WEPSUN Database Layer

This directory contains the PostgreSQL database configuration, Prisma ORM schema, and multi-tenant seeder scripts for WEPSUN Engineering Solution.

## 🛠 Schema Architecture
- **Schema File**: [`schema.prisma`](./schema.prisma)
- **Database Engine**: PostgreSQL (Supabase / RDS / Neon)
- **Multi-Tenant Isolation**: Tenant scoping enforced via `companyId` and `branchId` foreign keys on all operational models.

## 🚀 Commands

### Generate Prisma Client
```bash
npx prisma generate --schema=./database/schema.prisma
```

### Push Schema to Supabase/PostgreSQL
```bash
npx prisma db push --schema=./database/schema.prisma
```

### Run Multi-Tenant Seeder
```bash
npx tsx database/seed.ts
```

### Open Prisma Studio (GUI)
```bash
npx prisma studio --schema=./database/schema.prisma
```
