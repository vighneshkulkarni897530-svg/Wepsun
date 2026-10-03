import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Building,
  ShieldCheck,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Eye,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminClientsView: React.FC = () => {
  const { users, buildings, amcContracts, lifts } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [address, setAddress] = useState('');

  const clientList = [
    {
      id: 'usr-client-1',
      name: 'Mr. Arvind Joshi',
      designation: 'Society Chairman',
      society: 'Skyline Heights CHS',
      building: 'Skyline Towers (Wing A & B)',
      liftsCount: 4,
      amcStatus: 'Comprehensive (Active 🟢)',
      status: 'Active',
      phone: '+91 98201 44521',
      email: 'arvind.joshi@skyline.org',
      address: 'Plot 42, Sector 19, Vashi, Navi Mumbai - 400703',
      contractExpiry: '31 Dec 2026',
    },
    {
      id: 'usr-client-2',
      name: 'Mrs. Sunita Rao',
      designation: 'Facility Director',
      society: 'Sunrise Heights Society',
      building: 'Sunrise Apartments (Tower 1-3)',
      liftsCount: 6,
      amcStatus: 'Semi-Comprehensive (Active 🟢)',
      status: 'Active',
      phone: '+91 98203 99812',
      email: 'facility@sunrisegroup.in',
      address: 'Road No. 12, Baner, Pune - 411045',
      contractExpiry: '15 Nov 2026',
    },
    {
      id: 'usr-client-3',
      name: 'Dr. Rajesh Patil',
      designation: 'Managing Committee Member',
      society: 'Royal Residency Phase II',
      building: 'Royal Residency',
      liftsCount: 3,
      amcStatus: 'Comprehensive (Active 🟢)',
      status: 'Active',
      phone: '+91 97654 32109',
      email: 'rpatil@royalresidency.com',
      address: 'Hinjewadi Phase 1, Pune - 411057',
      contractExpiry: '28 Feb 2027',
    },
    {
      id: 'usr-client-4',
      name: 'Mr. Deepak Mehta',
      designation: 'Estate Manager',
      society: 'Galaxy Commercial Complex',
      building: 'Galaxy Heights',
      liftsCount: 5,
      amcStatus: 'Non-Comprehensive (Expiring 🟡)',
      status: 'Attention',
      phone: '+91 99887 76655',
      email: 'estate@galaxygroup.co.in',
      address: 'S.V. Road, Andheri West, Mumbai - 400058',
      contractExpiry: '15 Oct 2026',
    },
    {
      id: 'usr-client-5',
      name: 'Mr. Vikram Singhania',
      designation: 'President',
      society: 'Green Valley Cooperative Housing',
      building: 'Green Valley Towers',
      liftsCount: 2,
      amcStatus: 'Comprehensive (Active 🟢)',
      status: 'Active',
      phone: '+91 98111 22334',
      email: 'vikram.singhania@greenvalley.in',
      address: 'Near Tech Park, Whitefield, Bengaluru - 560066',
      contractExpiry: '31 Jan 2027',
    },
  ];

  const filteredClients = clientList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.society.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Client "${name}" registered successfully! Welcome email & SMS credentials sent.`);
    setIsAddClientModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setSocietyName('');
    setAddress('');
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

        <button
          onClick={() => setIsAddClientModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search Bar matching the exact specification: Search Client / Building / Lift */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Client / Building / Lift / Mobile..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F8FA] hover:bg-slate-100 focus:bg-white text-slate-800 text-xs font-medium placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#1976D2] focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Clients Table: Client | Building | Lifts | AMC | Status | Action */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
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
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-blue-50/40 transition-colors">
                  {/* Client Column */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span>{client.designation}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-slate-600">{client.phone}</span>
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
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1976D2] font-bold text-[11px] transition-colors flex items-center gap-1"
                        title="View Client Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setName(client.name);
                          setEmail(client.email);
                          setPhone(client.phone);
                          setSocietyName(client.society);
                          setAddress(client.address);
                          setIsAddClientModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setIsAddClientModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
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
                <label className="font-semibold text-slate-700 block mb-1">Client Full Name / Representative</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma (Chairman)"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
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
                <label className="font-semibold text-slate-700 block mb-1">Society / Commercial Complex Name</label>
                <input
                  type="text"
                  required
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  placeholder="e.g. Imperial Heights Cooperative Housing Society"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
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
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save & Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Details Modal */}
      {selectedClientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setSelectedClientForView(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold text-lg">
                {selectedClientForView.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedClientForView.name}</h3>
                <p className="text-xs text-slate-500">{selectedClientForView.designation} • {selectedClientForView.society}</p>
              </div>
            </div>

            <div className="space-y-3 bg-[#F5F8FA] p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-bold text-slate-900">{selectedClientForView.phone}</span>
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

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedClientForView(null)}
                className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs"
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
