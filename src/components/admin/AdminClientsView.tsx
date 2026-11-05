import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Building,
  ShieldCheck,
  Phone,
  Mail,
  Edit2,
  Eye,
  CheckCircle2,
  X,
  FileCheck,
  RefreshCw,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const AdminClientsView: React.FC = () => {
  const {
    users,
    buildings,
    amcContracts,
    lifts,
    showSuccessModal,
    addNewClient,
    addNewLift,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [isAddLiftModalOpen, setIsAddLiftModalOpen] = useState(false);
  const [targetClientForLift, setTargetClientForLift] = useState<any | null>(null);

  // Backend live clients state
  const [backendClients, setBackendClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit Client
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [address, setAddress] = useState('');
  const [initialLiftsCount, setInitialLiftsCount] = useState<number>(2);
  const [amcTier, setAmcTier] = useState('Comprehensive (Active 🟢)');

  // Form State for Quick Add Lift
  const [liftNumber, setLiftNumber] = useState('');
  const [liftType, setLiftType] = useState('Passenger');
  const [liftStops, setLiftStops] = useState(12);

  // Fetch live clients from cloud backend
  const loadLiveClients = useCallback(async () => {
    try {
      const res = await apiService.getClients();
      if (res && res.success && Array.isArray(res.data)) {
        setBackendClients(res.data);
      }
    } catch {
      // Gracefully fall back to local in-memory context state
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadLiveClients().finally(() => setIsLoading(false));

    // Real-time background poller: polls every 6s so newly registered clients appear automatically
    const poller = setInterval(loadLiveClients, 6000);
    return () => clearInterval(poller);
  }, [loadLiveClients]);

  // Dynamically compute the unified, live clients list
  const liveClients = useMemo(() => {
    const clientMap = new Map<string, any>();

    // 1. Ingest backend clients (from cloud PostgreSQL / Prisma)
    backendClients.forEach((bc) => {
      const key = (bc.id || bc.email || bc.name).toLowerCase();
      const linkedLifts =
        bc.lifts && bc.lifts.length > 0
          ? bc.lifts
          : lifts.filter(
              (l) =>
                l.clientId === bc.id ||
                (bc.email && l.clientName?.toLowerCase() === bc.name?.toLowerCase())
            );

      const linkedBuildings =
        bc.buildings && bc.buildings.length > 0
          ? bc.buildings
          : buildings.filter((b) => b.clientId === bc.id);

      const activeContract =
        bc.amcContracts && bc.amcContracts.length > 0
          ? bc.amcContracts[0]
          : amcContracts.find((a) => a.clientId === bc.id);

      const bldName = linkedBuildings[0]?.name || bc.name || 'WEPSUN Premises';
      const liftCount = Math.max(linkedLifts.length, linkedBuildings[0]?.totalLifts || 0, 1);

      clientMap.set(key, {
        id: bc.id,
        name: bc.contactPerson || bc.name || 'Client Representative',
        designation: bc.designation || 'Society Chairman / Owner',
        society: bldName,
        building: bldName,
        liftsCount: liftCount,
        liftsList: linkedLifts,
        amcStatus: activeContract
          ? `${(activeContract as any).amcType || (activeContract as any).contractType || 'Comprehensive'} (Active 🟢)`
          : 'Comprehensive (Active 🟢)',
        contractExpiry: activeContract?.endDate || '31 Dec 2026',
        status: 'Active',
        phone: bc.phone || '+91 85959 40077',
        email: bc.email || 'client@wepsun.in',
        address: bc.billingAddress || linkedBuildings[0]?.address || 'Site Address, Mumbai',
        createdAt: bc.createdAt || new Date().toISOString(),
      });
    });

    // 2. Ingest real client users from AppContext users (e.g. Vighnesh Kulkarni, new signups)
    const clientUsers = users.filter((u) => u.role === 'client');
    clientUsers.forEach((u) => {
      const key = (u.clientId || u.id || u.email).toLowerCase();
      if (!clientMap.has(key)) {
        const linkedBuildings = buildings.filter(
          (b) =>
            b.clientId === u.clientId ||
            b.clientId === u.id ||
            (b.clientName && b.clientName.toLowerCase() === u.name.toLowerCase())
        );

        const linkedLifts = lifts.filter(
          (l) =>
            l.clientId === u.clientId ||
            l.clientId === u.id ||
            (l.clientName && l.clientName.toLowerCase() === u.name.toLowerCase())
        );

        const activeContract = amcContracts.find(
          (a) => a.clientId === u.clientId || a.clientId === u.id
        );

        const societyDisplayName =
          linkedBuildings[0]?.name || u.companyName || `${u.name} Heights`;

        const liftCount = Math.max(linkedLifts.length, linkedBuildings[0]?.totalLifts || 0, 2);

        clientMap.set(key, {
          id: u.clientId || u.id,
          userId: u.id,
          name: u.name,
          designation: 'Society Representative / Owner',
          society: societyDisplayName,
          building: societyDisplayName,
          liftsCount: liftCount,
          liftsList: linkedLifts,
          amcStatus: activeContract
            ? `${(activeContract as any).amcType || (activeContract as any).contractType || 'Comprehensive'} (Active 🟢)`
            : 'Comprehensive (Active 🟢)',
          contractExpiry: activeContract?.endDate || '31 Dec 2026',
          status: 'Active',
          phone: u.phone || '+91 85959 40077',
          email: u.email,
          address:
            u.address || linkedBuildings[0]?.address || 'Palm Beach Road, Sector 19, Vashi, Navi Mumbai',
          createdAt: u.createdAt || new Date().toISOString(),
        });
      } else {
        // Refresh lift count if lifts exist in local state
        const existing = clientMap.get(key);
        const linkedLifts = lifts.filter((l) => l.clientId === u.clientId || l.clientId === u.id);
        if (linkedLifts.length > existing.liftsCount) {
          existing.liftsCount = linkedLifts.length;
          existing.liftsList = linkedLifts;
        }
      }
    });

    return Array.from(clientMap.values());
  }, [backendClients, users, buildings, lifts, amcContracts]);

  // Search filtering
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return liveClients;

    return liveClients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchSociety = c.society?.toLowerCase().includes(q);
      const matchBuilding = c.building?.toLowerCase().includes(q);
      const matchPhone = c.phone?.includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchLift = c.liftsList?.some((l: any) =>
        (l.liftNumber || l.permanentLiftId || '')?.toLowerCase().includes(q)
      );

      return matchName || matchSociety || matchBuilding || matchPhone || matchEmail || matchLift;
    });
  }, [liveClients, searchQuery]);

  // Add Client Form Handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addNewClient({
        name: name.trim(),
        contactPerson: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+91 85959 40077',
        societyName: societyName.trim() || `${name.trim()} Heights`,
        address: address.trim() || 'Site Address, Mumbai',
        initialLiftsCount: initialLiftsCount || 2,
        amcTier,
      });

      const registeredName = name.trim();
      setIsAddClientModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setSocietyName('');
      setAddress('');
      setInitialLiftsCount(2);

      // Trigger immediate background sync
      loadLiveClients();

      showSuccessModal(
        'Client Registered Successfully!',
        `Client "${registeredName}" and their society complex have been registered with live cloud database synchronization.`
      );
    } catch (err: any) {
      showToast('error', 'Registration Failed', err?.message || 'Could not register client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Client Form Handler
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      if (editingClient.id) {
        await apiService.updateClient(editingClient.id, {
          name: editingClient.name,
          contactPerson: editingClient.name,
          phone: editingClient.phone,
          email: editingClient.email,
          billingAddress: editingClient.address,
        });
      }

      showToast('success', 'Client Updated', `Updated details for ${editingClient.name}.`);
      setEditingClient(null);
      loadLiveClients();
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'Could not update client.');
    }
  };

  // Quick Add Lift for Client
  const handleQuickAddLift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientForLift) return;

    const bld = buildings.find(
      (b) => b.clientId === targetClientForLift.id || b.name === targetClientForLift.building
    ) || buildings[0];

    const generatedNumber =
      liftNumber.trim() ||
      `WPS-${targetClientForLift.id.slice(-4).toUpperCase()}-0${(targetClientForLift.liftsCount || 0) + 1}`;

    addNewLift({
      liftNumber: generatedNumber,
      buildingId: bld?.id || 'bld-1',
      buildingName: targetClientForLift.building || bld?.name || 'Main Tower',
      clientId: targetClientForLift.id,
      clientName: targetClientForLift.name,
      clientPhone: targetClientForLift.phone,
      brand: 'WEPSUN Gearless PMSM',
      model: 'AeroGlide-V3',
      type: liftType as any,
      stops: liftStops,
      locationDetails: `Wing ${String.fromCharCode(65 + ((targetClientForLift.liftsCount || 0) % 26))} - Lift`,
    });

    showToast('success', 'Lift Installed', `Lift ${generatedNumber} added for ${targetClientForLift.name}.`);
    setIsAddLiftModalOpen(false);
    setTargetClientForLift(null);
    setLiftNumber('');
    loadLiveClients();
  };

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#1976D2]" />
            Clients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage society chairmen, facility heads, commercial property managers, and accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLoading(true);
              loadLiveClients().finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Live Clients"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1976D2]' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all min-h-[44px] touch-manipulation cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search Bar matching the exact specification: Search Client / Building / Lift / Mobile... */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Client / Building / Lift / Mobile..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F8FA] hover:bg-slate-100 focus:bg-white text-slate-800 text-xs font-medium placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#1976D2] focus:outline-none transition-all shadow-inner min-h-[42px]"
          />
        </div>
      </div>

      {/* Clients List: Mobile Cards + Desktop Table */}
      {/* 1. Mobile Cards View (Visible on < md) */}
      <div className="block md:hidden space-y-3.5">
        {filteredClients.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No registered clients found.</p>
            <p className="text-xs text-slate-500 mt-1">
              New client accounts will appear here automatically upon registration.
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{client.designation}</div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    client.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  ● {client.status}
                </span>
              </div>

              <div className="space-y-1.5 bg-[#F5F8FA] p-3 rounded-xl border border-slate-200/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Building:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                    {client.building}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Society:</span>
                  <span className="text-slate-700 text-right truncate max-w-[200px]">
                    {client.society}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fleet Units:</span>
                  <span className="font-bold text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {client.liftsCount} Lifts
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">AMC Tier:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                    {client.amcStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contract Expiry:</span>
                  <span className="font-mono text-slate-600">{client.contractExpiry}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <a
                  href={`tel:${client.phone.replace(/\s+/g, '')}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 touch-manipulation min-h-[40px]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1976D2]" />
                  <span>Call</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedClientForView(client)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1976D2] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 touch-manipulation min-h-[40px]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingClient(client)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center touch-manipulation min-h-[40px] min-w-[40px]"
                  title="Edit Client"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. Desktop Table (Visible on md and up) */}
      <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Building</th>
                <th className="py-3.5 px-4">Lifts</th>
                <th className="py-3.5 px-4">AMC</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No registered clients found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Registered users and customer accounts will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Client Column */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>{client.designation}</span>
                        <span className="text-slate-300">•</span>
                        <a
                          href={`tel:${client.phone.replace(/\s+/g, '')}`}
                          className="font-mono text-slate-600 hover:text-[#1976D2]"
                        >
                          {client.phone}
                        </a>
                      </div>
                    </td>

                    {/* Building Column */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {client.building}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{client.society}</div>
                    </td>

                    {/* Lifts Column */}
                    <td className="py-3.5 px-4 font-semibold">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-[#1976D2] font-bold text-xs border border-blue-100">
                        {client.liftsCount} Lifts
                      </span>
                    </td>

                    {/* AMC Column */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-semibold">{client.amcStatus}</div>
                      <div className="text-[11px] text-slate-400">Expires: {client.contractExpiry}</div>
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          client.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        ● {client.status}
                      </span>
                    </td>

                    {/* Action Column with Buttons: View, Edit */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedClientForView(client)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1976D2] font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Client Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setEditingClient(client)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit Client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-800 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddClientModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Add New Client</h3>
                <p className="text-xs text-slate-500">Register new customer profile & society account</p>
              </div>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client Full Name / Representative *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 85959 40077"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="society@example.com"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Society / Commercial Complex Name *</label>
                <input
                  type="text"
                  required
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  placeholder="e.g. Imperial Heights Cooperative Housing Society"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Lifts Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={initialLiftsCount}
                    onChange={(e) => setInitialLiftsCount(Number(e.target.value) || 1)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">AMC Tier</label>
                  <select
                    value={amcTier}
                    onChange={(e) => setAmcTier(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  >
                    <option value="Comprehensive (Active 🟢)">Comprehensive (Active 🟢)</option>
                    <option value="Semi-Comprehensive (Active 🟢)">Semi-Comprehensive (Active 🟢)</option>
                    <option value="Non-Comprehensive (Active 🟢)">Non-Comprehensive (Active 🟢)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Site Address & Location</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, pincode..."
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-800 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingClient(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Client Profile</h3>
                <p className="text-xs text-slate-500">Update contact and address information</p>
              </div>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Representative Name</label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Society / Complex</label>
                <input
                  type="text"
                  value={editingClient.society}
                  onChange={(e) => setEditingClient({ ...editingClient, society: e.target.value })}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Premises Address</label>
                <textarea
                  rows={2}
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Lift Modal for this Client */}
      {isAddLiftModalOpen && targetClientForLift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => {
                setIsAddLiftModalOpen(false);
                setTargetClientForLift(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Install Lift for Client</h3>
                <p className="text-xs text-slate-500">{targetClientForLift.name} • {targetClientForLift.society}</p>
              </div>
            </div>

            <form onSubmit={handleQuickAddLift} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lift Equipment ID / Number</label>
                <input
                  type="text"
                  value={liftNumber}
                  onChange={(e) => setLiftNumber(e.target.value)}
                  placeholder={`e.g. WPS-${targetClientForLift.id.slice(-4).toUpperCase()}-0${(targetClientForLift.liftsCount || 0) + 1}`}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lift Type</label>
                  <select
                    value={liftType}
                    onChange={(e) => setLiftType(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  >
                    <option value="Passenger">Passenger</option>
                    <option value="Freight">Freight / Goods</option>
                    <option value="Stretcher">Stretcher / Hospital</option>
                    <option value="Hydraulic">Hydraulic</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Stops</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={liftStops}
                    onChange={(e) => setLiftStops(Number(e.target.value) || 12)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddLiftModalOpen(false);
                    setTargetClientForLift(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Register Lift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Details Modal */}
      {selectedClientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-800 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedClientForView(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold text-lg">
                {selectedClientForView.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedClientForView.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedClientForView.designation} • {selectedClientForView.society}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-[#F5F8FA] p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Number:</span>
                <a
                  href={`tel:${selectedClientForView.phone.replace(/\s+/g, '')}`}
                  className="font-bold text-[#1976D2] hover:underline"
                >
                  {selectedClientForView.phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-900">{selectedClientForView.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Building:</span>
                <span className="font-bold text-slate-900">{selectedClientForView.building}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Registered Lifts:</span>
                <span className="font-bold text-[#1976D2]">{selectedClientForView.liftsCount} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AMC Tier & Status:</span>
                <span className="font-bold text-emerald-700">{selectedClientForView.amcStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AMC Expiry Date:</span>
                <span className="font-bold text-slate-900">{selectedClientForView.contractExpiry}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Site Address:</span>
                <span className="font-medium text-slate-700">{selectedClientForView.address}</span>
              </div>
            </div>

            {/* Registered Lifts Preview */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Fleet Equipment Installed:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetClientForLift(selectedClientForView);
                    setIsAddLiftModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1976D2] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Install Lift</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedClientForView.liftsList && selectedClientForView.liftsList.length > 0 ? (
                  selectedClientForView.liftsList.map((lift: any, idx: number) => (
                    <div
                      key={lift.id || idx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-bold text-slate-800">
                        {lift.liftNumber || lift.permanentLiftId || `Lift #${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {lift.model || lift.brand || 'Gearless PMSM'} • {lift.currentStatus || 'OPERATIONAL'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-slate-600">
                    {selectedClientForView.liftsCount} Registered elevator fleet units in active service.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <a
                href={`tel:${selectedClientForView.phone.replace(/\s+/g, '')}`}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Client</span>
              </a>

              <button
                onClick={() => setSelectedClientForView(null)}
                className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-blue-600/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
