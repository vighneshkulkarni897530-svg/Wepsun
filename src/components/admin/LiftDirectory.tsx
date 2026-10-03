import React, { useState } from 'react';
import {
  Layers,
  Search,
  Plus,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle2,
  Wrench,
  Printer,
  Sparkles,
  X,
  Eye,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lift, LiftType, MachineType } from '../../types';
import { LiftPassportModal } from '../common/LiftPassportModal';
import { LiftQrModal } from '../common/LiftQrModal';
import { IoTLiftSimulationModal } from '../common/IoTLiftSimulationModal';
import { Activity, Cpu } from 'lucide-react';

export const LiftDirectory: React.FC = () => {
  const { lifts, buildings, addNewLift, amcContracts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLiftForPassport, setSelectedLiftForPassport] = useState<Lift | null>(null);
  const [selectedLiftForQr, setSelectedLiftForQr] = useState<Lift | null>(null);
  const [selectedLiftForIoT, setSelectedLiftForIoT] = useState<Lift | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLift, setEditingLift] = useState<Lift | null>(null);

  // New lift form
  const [liftNumber, setLiftNumber] = useState('');
  const [buildingId, setBuildingId] = useState(buildings[0]?.id || '');
  const [brand, setBrand] = useState('WEPSUN MRL Traction');
  const [model, setModel] = useState('WEP-MAX 3000 Eco');
  const [type, setType] = useState<LiftType>('Passenger');
  const [machineType, setMachineType] = useState<MachineType>('Gearless PMSM');
  const [capacityPersons, setCapacityPersons] = useState(8);
  const [capacityKg, setCapacityKg] = useState(544);
  const [speedMps, setSpeedMps] = useState(1.5);
  const [floors, setFloors] = useState('G + 12 Floors');
  const [stops, setStops] = useState(13);
  const [controllerBrand, setControllerBrand] = useState('Monarch NICE 3000+');
  const [locationDetails, setLocationDetails] = useState('Wing A - Passenger Lift');

  const filteredLifts = lifts.filter((lift) => {
    const matchSearch =
      lift.liftNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lift.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lift.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lift.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lift.controllerBrand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || lift.currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bld = buildings.find((b) => b.id === buildingId) || buildings[0];

    addNewLift({
      liftNumber: liftNumber || `WEPSUN-${Math.floor(100 + Math.random() * 900)}`,
      buildingId: bld.id,
      buildingName: bld.name,
      clientId: bld.clientId,
      clientName: bld.clientName,
      clientPhone: bld.contactPhone,
      brand,
      model,
      type,
      machineType,
      capacityPersons,
      capacityKg,
      speedMps,
      floors,
      stops,
      controllerBrand,
      locationDetails,
    });

    setIsAddModalOpen(false);
    setEditingLift(null);
    setLiftNumber('');
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Page Heading & Header matching Page 26 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#1976D2]" />
            Lift Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Digital lifecycle registry, equipment details, AMC contracts, and unique QR passports.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingLift(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Lift Unit
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Lift ID / Number / Building / Client..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] focus:ring-1 focus:ring-[#1976D2] outline-none shadow-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none font-medium shadow-sm focus:border-[#1976D2]"
          >
            <option value="All">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="breakdown">Breakdown</option>
            <option value="under_maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Lifts Table matching Page 26 Information & Buttons:
          Information: Lift ID, Lift Number, Building, Client, Brand, Model, Capacity, Installation Date, AMC, Status
          Buttons: View Digital Passport, Edit Lift, Generate QR
      */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-3">Lift ID / Number</th>
              <th className="py-3.5 px-3">Building & Client</th>
              <th className="py-3.5 px-3">Brand & Model</th>
              <th className="py-3.5 px-3">Capacity</th>
              <th className="py-3.5 px-3">Installation Date</th>
              <th className="py-3.5 px-3">AMC Status</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLifts.map((lift, index) => (
              <tr key={lift.id} className="hover:bg-blue-50/40 text-slate-700 transition-colors">
                {/* Lift ID / Number */}
                <td className="py-3.5 px-3 font-mono">
                  <div className="font-bold text-[#1976D2] text-xs">
                    {lift.liftNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">LFT-00{index + 1}</div>
                </td>

                {/* Building & Client */}
                <td className="py-3.5 px-3">
                  <div className="font-bold text-slate-900">{lift.buildingName}</div>
                  <div className="text-[11px] text-slate-500">{lift.clientName || 'Skyline Heights CHS'}</div>
                </td>

                {/* Brand & Model */}
                <td className="py-3.5 px-3">
                  <div className="font-semibold text-slate-800">{lift.brand}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{lift.model || 'WEP-MAX 3000'}</div>
                </td>

                {/* Capacity */}
                <td className="py-3.5 px-3 font-medium">
                  <span className="text-slate-900 font-bold">{lift.capacityPersons} Persons</span>
                  <div className="text-[11px] text-slate-500">{lift.capacityKg} kg • {lift.speedMps} m/s</div>
                </td>

                {/* Installation Date */}
                <td className="py-3.5 px-3">
                  <span className="font-medium text-slate-800">12 Jan 2022</span>
                  <div className="text-[10px] text-slate-400">Warranty: Active</div>
                </td>

                {/* AMC Status */}
                <td className="py-3.5 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      lift.amcStatus === 'active'
                        ? 'bg-emerald-100 text-[#2E7D32]'
                        : lift.amcStatus === 'expiring_soon'
                        ? 'bg-amber-100 text-[#F9A825]'
                        : 'bg-red-100 text-[#D32F2F]'
                    }`}
                  >
                    ● {lift.amcStatus.replace('_', ' ')}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      lift.currentStatus === 'operational'
                        ? 'bg-emerald-100 text-[#2E7D32]'
                        : lift.currentStatus === 'breakdown'
                        ? 'bg-red-100 text-[#D32F2F] animate-pulse'
                        : 'bg-amber-100 text-[#F9A825]'
                    }`}
                  >
                    {lift.currentStatus.replace('_', ' ')}
                  </span>
                </td>

                {/* Actions: View Digital Passport, Edit Lift, Generate QR */}
                <td className="py-3.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedLiftForIoT(lift)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-[11px] border border-cyan-500/40 shadow-sm transition-all flex items-center gap-1"
                      title="Launch Live IoT Telemetry & 3D Twin"
                    >
                      <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>IoT Live</span>
                    </button>

                    <button
                      onClick={() => setSelectedLiftForPassport(lift)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1976D2] font-bold text-[11px] border border-blue-200 transition-colors flex items-center gap-1"
                      title="View Digital Passport"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden xl:inline">Passport</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingLift(lift);
                        setLiftNumber(lift.liftNumber);
                        setBrand(lift.brand);
                        setModel(lift.model);
                        setCapacityPersons(lift.capacityPersons);
                        setCapacityKg(lift.capacityKg);
                        setIsAddModalOpen(true);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1"
                      title="Edit Lift"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span className="hidden xl:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => setSelectedLiftForQr(lift)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition-colors flex items-center gap-1"
                      title="Generate QR Code"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>QR</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Lift Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-800 max-h-[92vh] overflow-y-auto flex flex-col gap-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingLift(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  {editingLift ? 'Edit Lift Details' : 'Register New Elevator Unit'}
                </h3>
                <p className="text-xs text-slate-500">
                  Creates permanent digital profile, initializes QR code, and schedules PM routines
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lift Number / Plate ID</label>
                  <input
                    type="text"
                    required
                    value={liftNumber}
                    onChange={(e) => setLiftNumber(e.target.value)}
                    placeholder="e.g. WEPSUN-001"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Building / Complex</label>
                  <select
                    value={buildingId}
                    onChange={(e) => setBuildingId(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Brand / Make</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Model Name / Series</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Capacity (Persons)</label>
                  <input
                    type="number"
                    value={capacityPersons}
                    onChange={(e) => setCapacityPersons(Number(e.target.value))}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Capacity (Kg)</label>
                  <input
                    type="number"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Number(e.target.value))}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Rated Speed (m/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={speedMps}
                    onChange={(e) => setSpeedMps(Number(e.target.value))}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingLift(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  {editingLift ? 'Update Lift Unit' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lift Passport Modal */}
      <LiftPassportModal
        lift={selectedLiftForPassport}
        isOpen={!!selectedLiftForPassport}
        onClose={() => setSelectedLiftForPassport(null)}
      />

      {/* Lift QR Code Modal */}
      <LiftQrModal
        lift={selectedLiftForQr}
        isOpen={!!selectedLiftForQr}
        onClose={() => setSelectedLiftForQr(null)}
        onOpenPassport={(l) => setSelectedLiftForPassport(l)}
      />

      {/* IoT Lift Telemetry & 3D Simulation Modal */}
      <IoTLiftSimulationModal
        lift={selectedLiftForIoT}
        isOpen={!!selectedLiftForIoT}
        onClose={() => setSelectedLiftForIoT(null)}
      />
    </div>
  );
};
