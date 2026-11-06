/**
 * WEPSUN Test Suite — Resilient Prisma Client Adapter
 * Enables tests to run seamlessly against live PostgreSQL when available,
 * or against a high-fidelity in-memory database when offline / in local sandbox.
 */

import { prisma as realPrisma, checkDatabaseConnection } from '../lib/prisma.js';

interface InMemoryTable {
  [key: string]: any[];
}

function matchCondition(itemVal: any, cond: any): boolean {
  if (cond === undefined) return true;
  if (cond === null) return itemVal === null;
  if (typeof cond === 'object' && cond !== null && !(cond instanceof Date)) {
    if ('equals' in cond) {
      if (cond.mode === 'insensitive') {
        return String(itemVal || '').toLowerCase() === String(cond.equals || '').toLowerCase();
      }
      return itemVal === cond.equals;
    }
    if ('contains' in cond) {
      const mode = cond.mode;
      const haystack = mode === 'insensitive' ? String(itemVal || '').toLowerCase() : String(itemVal || '');
      const needle = mode === 'insensitive' ? String(cond.contains || '').toLowerCase() : String(cond.contains || '');
      return haystack.includes(needle);
    }
    if ('in' in cond && Array.isArray(cond.in)) {
      return cond.in.includes(itemVal);
    }
    if ('not' in cond) {
      return !matchCondition(itemVal, cond.not);
    }
  }
  return itemVal === cond;
}

function matchWhere(item: any, where?: any, store?: InMemoryTable): boolean {
  if (!where || Object.keys(where).length === 0) return true;
  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR' && Array.isArray(value)) {
      if (!value.some((subWhere) => matchWhere(item, subWhere, store))) return false;
      continue;
    }
    if (key === 'AND' && Array.isArray(value)) {
      if (!value.every((subWhere) => matchWhere(item, subWhere, store))) return false;
      continue;
    }
    if (key === 'NOT') {
      if (matchWhere(item, value, store)) return false;
      continue;
    }
    if (key === 'lift' && store?.lift && typeof value === 'object') {
      const lift = store.lift.find((l) => l.id === item.liftId);
      if (!lift || !matchWhere(lift, value, store)) return false;
      continue;
    }
    if (!matchCondition(item[key], value)) return false;
  }
  return true;
}

function attachIncludes(item: any, tableName: string, include: any, store: InMemoryTable): any {
  if (!item || !include) return item;
  const result = { ...item };

  if (tableName === 'complaint') {
    if (include.lift) {
      const lift = store.lift.find((l) => l.id === item.liftId);
      if (lift) {
        let enrichedLift = { ...lift };
        if (include.lift.include?.building) {
          enrichedLift.building = store.building.find((b) => b.id === lift.buildingId) || null;
        }
        if (include.lift.include?.client) {
          enrichedLift.client = store.client.find((c) => c.id === lift.clientId) || null;
        }
        result.lift = enrichedLift;
      } else {
        result.lift = null;
      }
    }
    if (include.timelineEntries) {
      result.timelineEntries = (store.complaintTimeline || []).filter(
        (t) => t.complaintId === item.id
      );
    }
  }

  if (tableName === 'serviceReport') {
    if (include.lift) {
      result.lift = store.lift.find((l) => l.id === item.liftId) || null;
    }
  }

  if (tableName === 'user') {
    if (include.technician) {
      result.technician = (store.technician || []).find((t) => t.id === item.technicianId || t.email === item.email) || null;
    }
  }

  if (tableName === 'technician') {
    if (include.user) {
      result.user = (store.user || []).find((u) => u.technicianId === item.id || u.email === item.email) || null;
    }
    if (include.branch) {
      result.branch = (store.branch || []).find((b) => b.id === item.branchId) || null;
    }
  }

  return result;
}

function applyDataUpdates(target: any, data: any): any {
  const result = { ...target };
  for (const [key, val] of Object.entries(data || {})) {
    if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
      if ('increment' in val && typeof (val as any).increment === 'number') {
        const cur = typeof target[key] === 'number' ? target[key] : 0;
        result[key] = cur + (val as any).increment;
        continue;
      }
      if ('decrement' in val && typeof (val as any).decrement === 'number') {
        const cur = typeof target[key] === 'number' ? target[key] : 0;
        result[key] = cur - (val as any).decrement;
        continue;
      }
    }
    result[key] = val;
  }
  result.updatedAt = new Date();
  return result;
}

export function createInMemoryPrisma(): any {
  const store: InMemoryTable = {
    company: [
      { id: 'comp-1', name: 'WEPSUN Engineering Solutions', code: 'WEPSUN', isActive: true }
    ],
    branch: [
      { id: 'br-mum-1', companyId: 'comp-1', name: 'Main Hub', code: 'MAIN', city: 'Mumbai', state: 'Maharashtra', address: 'MIDC' }
    ],
    user: [
      {
        id: 'usr-admin-1',
        companyId: 'comp-1',
        branchId: 'br-mum-1',
        name: 'Sumit Jaiswal',
        email: 'sumit@wepsun.in',
        role: 'COMPANY_ADMIN',
        isActive: true,
      },
      {
        id: 'usr-client-1',
        companyId: 'comp-1',
        branchId: 'br-mum-1',
        name: 'Vighnesh Kulkarni',
        email: 'vighnesh@wepsun.in',
        role: 'CLIENT',
        isActive: true,
      },
    ],
    client: [],
    building: [],
    lift: [],
    complaint: [],
    complaintTimeline: [],
    serviceReport: [],
    technician: [],
    userSession: [],
    auditLog: [],
    workOrder: [],
  };

  const createModelHandler = (tableName: string) => {
    return {
      findFirst: async (args?: any) => {
        const table = store[tableName] || [];
        const found = table.find((item) => matchWhere(item, args?.where, store));
        return found ? attachIncludes(found, tableName, args?.include, store) : null;
      },
      findUnique: async (args: any) => {
        const table = store[tableName] || [];
        const found = table.find((item) => matchWhere(item, args?.where, store));
        return found ? attachIncludes(found, tableName, args?.include, store) : null;
      },
      findMany: async (args?: any) => {
        const table = store[tableName] || [];
        let results = table.filter((item) => matchWhere(item, args?.where, store));
        if (args?.orderBy) {
          const [orderKey, orderDir] = Object.entries(args.orderBy)[0] as [string, 'asc' | 'desc'];
          results = [...results].sort((a, b) => {
            if (a[orderKey] < b[orderKey]) return orderDir === 'desc' ? 1 : -1;
            if (a[orderKey] > b[orderKey]) return orderDir === 'desc' ? -1 : 1;
            return 0;
          });
        }
        if (args?.take) {
          results = results.slice(0, args.take);
        }
        return results.map((item) => attachIncludes(item, tableName, args?.include, store));
      },
      create: async (args: any) => {
        if (!store[tableName]) store[tableName] = [];
        const { timelineEntries, ...restData } = args.data || {};
        if (tableName === 'technician') {
          if (restData.permanentId === undefined) restData.permanentId = null;
          if (restData.approvedAt === undefined) restData.approvedAt = null;
          if (restData.approvedBy === undefined) restData.approvedBy = null;
          if (restData.rejectedAt === undefined) restData.rejectedAt = null;
          if (restData.rejectedBy === undefined) restData.rejectedBy = null;
          if (restData.rejectionReason === undefined) restData.rejectionReason = null;
          if (restData.blockedAt === undefined) restData.blockedAt = null;
          if (restData.blockedBy === undefined) restData.blockedBy = null;
          if (restData.blockReason === undefined) restData.blockReason = null;
        }
        const record = {
          id: restData.id || `${tableName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...restData,
        };
        store[tableName].push(record);

        // Handle nested timelineEntries if provided
        if (timelineEntries?.create) {
          if (!store.complaintTimeline) store.complaintTimeline = [];
          const entries = Array.isArray(timelineEntries.create) ? timelineEntries.create : [timelineEntries.create];
          for (const entry of entries) {
            store.complaintTimeline.push({
              id: `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              complaintId: record.id,
              createdAt: new Date(),
              ...entry,
            });
          }
        }

        return attachIncludes(record, tableName, args?.include, store);
      },
      update: async (args: any) => {
        const table = store[tableName] || [];
        const index = table.findIndex((item) => matchWhere(item, args.where, store));
        if (index === -1) {
          throw new Error(`Record not found in ${tableName} for update with where ${JSON.stringify(args.where)}`);
        }
        const updated = applyDataUpdates(table[index], args.data);
        table[index] = updated;
        return attachIncludes(updated, tableName, args?.include, store);
      },
      updateMany: async (args: any) => {
        const table = store[tableName] || [];
        let count = 0;
        for (let i = 0; i < table.length; i++) {
          if (matchWhere(table[i], args.where, store)) {
            table[i] = applyDataUpdates(table[i], args.data);
            count++;
          }
        }
        return { count };
      },
      delete: async (args: any) => {
        const table = store[tableName] || [];
        const index = table.findIndex((item) => matchWhere(item, args.where, store));
        if (index === -1) return null;
        const deleted = table.splice(index, 1)[0];
        return deleted;
      },
      deleteMany: async (args?: any) => {
        const table = store[tableName] || [];
        let count = 0;
        if (!args?.where || Object.keys(args.where).length === 0) {
          count = table.length;
          store[tableName] = [];
          return { count };
        }
        store[tableName] = table.filter((item) => {
          if (matchWhere(item, args.where, store)) {
            count++;
            return false;
          }
          return true;
        });
        return { count };
      },
      count: async (args?: any) => {
        const table = store[tableName] || [];
        return table.filter((item) => matchWhere(item, args?.where, store)).length;
      },
    };
  };

  const client: any = new Proxy({}, {
    get(target, prop: string) {
      if (prop === '$transaction') {
        return async (arg: any) => {
          if (typeof arg === 'function') {
            return await arg(client);
          }
          if (Array.isArray(arg)) {
            const results = [];
            for (const p of arg) {
              results.push(await p);
            }
            return results;
          }
          return arg;
        };
      }
      if (prop === '$queryRaw') {
        return async () => [{ ping: 1 }];
      }
      return createModelHandler(prop);
    },
  });

  return client;
}

let cachedClient: any = null;

export async function getTestPrisma(): Promise<any> {
  if (cachedClient) return cachedClient;
  const status = await checkDatabaseConnection();
  if (status.connected) {
    cachedClient = realPrisma;
    return realPrisma;
  }
  console.log(`  ℹ️ Note: Live PostgreSQL is offline (${status.error || 'unreachable'}). Using resilient in-memory database.`);
  cachedClient = createInMemoryPrisma();
  return cachedClient;
}
