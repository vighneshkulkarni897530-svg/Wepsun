import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Search,
  History,
  User,
  Clock,
  Filter,
  FileText,
  Layers,
  Wrench,
  DollarSign,
  Package,
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { tenantAuditLogs, activeCompany } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = tenantAuditLogs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEntity = entityFilter === 'all' || log.entityType === entityFilter;
    return matchSearch && matchEntity;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Complaint':
        return <Wrench className="w-3.5 h-3.5 text-rose-500" />;
      case 'Lift':
        return <Layers className="w-3.5 h-3.5 text-[#1976D2]" />;
      case 'AmcContract':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Quotation':
      case 'WorkOrder':
      case 'Invoice':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'Inventory':
        return <Package className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Top Banner */}
      <div className="bg-[#F5F8FA] p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-blue-100 border border-blue-200 text-[#1976D2] font-mono text-xs font-bold uppercase tracking-wider">
              IMMUTABLE AUDIT TRAIL
            </span>
            <span className="text-xs text-slate-500 font-mono">• {activeCompany.name}</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
            System Activity & Security Audit Logs
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log of all user actions, technician dispatches, inventory movements, and status changes
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, user, entity ID, remarks..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] focus:ring-1 focus:ring-[#1976D2] outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'Complaint', 'Lift', 'Quotation', 'WorkOrder', 'Inventory', 'AmcContract'].map((entity) => (
            <button
              key={entity}
              onClick={() => setEntityFilter(entity)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono tracking-wider transition-all whitespace-nowrap ${
                entityFilter === entity
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {entity}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Entity</th>
              <th className="p-3.5">Action Executed</th>
              <th className="p-3.5">Actor / Role</th>
              <th className="p-3.5">Details & Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No audit logs recorded matching this filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50 text-slate-700 transition-colors">
                  <td className="p-3.5 text-[11px] text-slate-500 whitespace-nowrap font-mono">
                    {new Date(log.timestamp).toLocaleDateString()}{' '}
                    <span className="text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] text-slate-800 font-semibold">
                      {getEntityIcon(log.entityType)} {log.entityType}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-[#1976D2]">
                    {log.action}
                  </td>

                  <td className="p-3.5 font-sans">
                    <div className="font-bold text-slate-900">{log.performedBy}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">{log.userRole}</div>
                  </td>

                  <td className="p-3.5 font-sans text-xs text-slate-600 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
