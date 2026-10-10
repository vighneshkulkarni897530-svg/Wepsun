import React, { useState, useMemo } from 'react';
import {
  Building as BuildingIcon,
  Search,
  Plus,
  Layers,
  ShieldCheck,
  MapPin,
  Users,
  Eye,
  ArrowRight,
  X,
  CheckCircle2,
  Wrench,
  Building2,
  Phone,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lift, LiftType, Building } from '../../types';

interface AdminBuildingsViewProps {
  onNavigateToLifts?: (buildingId?: string) => void;
}

export const AdminBuildingsView: React.FC<AdminBuildingsViewProps> = ({ onNavigateToLifts }) => {
  const { buildings, tenantBuildings, lifts, addNewLift, addNewBuilding, showToast, activeCompany } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuildingForView, setSelectedBuildingForView] = useState<any | null>(null);
  
  // Modals
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isAddLiftModalOpen, setIsAddLiftModalOpen] = useState(false);
  const [targetBuildingIdForAdd, setTargetBuildingIdForAdd] = useState<string>('');

  // New Building Form State
  const [newBldName, setNewBldName] = useState('');
  const [newBldAddress, setNewBldAddress] = useState('');
  const [newBldCity, setNewBldCity] = useState('Mumbai');
  const [newBldPin, setNewBldPin] = useState('400001');
  const [newBldClient, setNewBldClient] = useState('');
  const [newBldContactPerson, setNewBldContactPerson] = useState('');
  const [newBldPhone, setNewBldPhone] = useState('');
  const [newBldZone, setNewBldZone] = useState('Mumbai Western Hub');
  const [newBldAmcTier, setNewBldAmcTier] = useState('Comprehensive (Active 🟢)');

  // Lift Form state
  const [liftNumber, setLiftNumber] = useState('');
  const [brand, setBrand] = useState('WEPSUN MRL Traction');
  const [model, setModel] = useState('WEP-MAX 3000 Eco');
  const [type, setType] = useState<LiftType>('Passenger');
  const [capacityPersons, setCapacityPersons] = useState(8);
  const [capacityKg, setCapacityKg] = useState(544);
  const [speedMps, setSpeedMps] = useState(1.5);
  const [stops, setStops] = useState(12);

  // Combined Live Buildings List
  const allBuildingsList = useMemo(() => {
    const staticDefaults = [
      {
        id: 'bld-skyline',
        name: 'Skyline Towers (Wing A & B)',
        address: 'Plot 42, Sector 19, Vashi, Navi Mumbai, MH - 400703',
        client: 'Skyline Heights CHS (Mr. Arvind Joshi)',
        numberOfLifts: 4,
        amcStatus: 'Comprehensive (Active 🟢)',
        serviceStatus: 'All Operational',
        zone: 'Navi Mumbai Zone',
        lastInspection: '12 Sep 2026',
        nextPM: '15 Oct 2026',
      },
      {
        id: 'bld-sunrise',
        name: 'Sunrise Apartments (Tower 1-3)',
        address: 'Road No. 12, Baner, Pune, MH - 411045',
        client: 'Sunrise Heights Society (Mrs. Sunita Rao)',
        numberOfLifts: 6,
        amcStatus: 'Semi-Comprehensive (Active 🟢)',
        serviceStatus: '1 Lift in Inspection',
        zone: 'Pune West Hub',
        lastInspection: '08 Sep 2026',
        nextPM: '20 Oct 2026',
      },
      {
        id: 'bld-royal',
        name: 'Royal Residency',
        address: 'Hinjewadi Phase 1, Near Infosys Circle, Pune, MH - 411057',
        client: 'Royal Residency Phase II (Dr. Rajesh Patil)',
        numberOfLifts: 3,
        amcStatus: 'Comprehensive (Active 🟢)',
        serviceStatus: 'All Operational',
        zone: 'Pune Tech Zone',
        lastInspection: '14 Sep 2026',
        nextPM: '28 Oct 2026',
      },
      {
        id: 'bld-galaxy',
        name: 'Galaxy Heights Commercial Complex',
        address: 'S.V. Road, Near Andheri Station, Mumbai, MH - 400058',
        client: 'Galaxy Commercial Complex (Mr. Deepak Mehta)',
        numberOfLifts: 5,
        amcStatus: 'Non-Comprehensive (Expiring Soon 🟡)',
        serviceStatus: 'All Operational',
        zone: 'Mumbai Western Suburbs',
        lastInspection: '01 Sep 2026',
        nextPM: '18 Oct 2026',
      },
      {
        id: 'bld-greenvalley',
        name: 'Green Valley Towers',
        address: 'Near ITPL, Whitefield, Bengaluru, KA - 560066',
        client: 'Green Valley Cooperative Housing (Mr. Vikram Singhania)',
        numberOfLifts: 2,
        amcStatus: 'Comprehensive (Active 🟢)',
        serviceStatus: 'All Operational',
        zone: 'Bengaluru East',
        lastInspection: '10 Sep 2026',
        nextPM: '12 Nov 2026',
      },
    ];

    const dynamicMapped = (tenantBuildings || buildings || []).map((b) => {
      const bLifts = lifts.filter((l) => l.buildingId === b.id);
      return {
        id: b.id,
        name: b.name,
        address: b.address + (b.city ? `, ${b.city}` : ''),
        client: b.clientName || b.contactPerson || 'Registered Client',
        numberOfLifts: bLifts.length || b.totalLifts || 1,
        amcStatus: 'Comprehensive (Active 🟢)',
        serviceStatus: 'All Operational',
        zone: b.city ? `${b.city} Operations Hub` : 'Regional Operations Hub',
        lastInspection: '14 Sep 2026',
        nextPM: '15 Oct 2026',
      };
    });

    const combined = [...dynamicMapped];
    staticDefaults.forEach((s) => {
      if (!combined.some((c) => c.name.toLowerCase() === s.name.toLowerCase() || c.id === s.id)) {
        combined.push(s);
      }
    });

    return combined;
  }, [buildings, tenantBuildings, lifts]);

  const filteredBuildings = allBuildingsList.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBuildingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBldName.trim()) {
      showToast('error', 'Incomplete Form', 'Please provide a building / society name.');
      return;
    }

    addNewBuilding({
      name: newBldName.trim(),
      address: newBldAddress.trim() || 'Site Address',
      city: newBldCity,
      pinCode: newBldPin,
      clientName: newBldClient.trim() || 'Society Committee',
      contactPerson: newBldContactPerson.trim() || 'Secretary',
      contactPhone: newBldPhone.trim() || '+91 98200 12345',
      totalLifts: 0,
    });

    setIsAddBuildingModalOpen(false);
    setNewBldName('');
    setNewBldAddress('');
    setNewBldClient('');
    setNewBldContactPerson('');
    setNewBldPhone('');
  };

  const handleAddLiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bld = allBuildingsList.find((b) => b.id === targetBuildingIdForAdd) || allBuildingsList[0];

    addNewLift({
      liftNumber: liftNumber || `WEP-LFT-${Math.floor(100 + Math.random() * 900)}`,
      buildingId: bld.id,
      buildingName: bld.name,
      clientId: 'usr-client-1',
      clientName: bld.client,
      brand,
      model,
      type,
      machineType: 'Gearless PMSM',
      capacityPersons,
      capacityKg,
      speedMps,
      floors: `G + ${stops} Floors`,
      stops,
      controllerBrand: 'Monarch NICE 3000+',
      locationDetails: 'Passenger Elevator Shaft',
    });

    setIsAddLiftModalOpen(false);
    setLiftNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BuildingIcon className="w-6 h-6 text-[#1976D2]" />
            Buildings & Societies Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Client sites, multi-society properties, elevator installations, and AMC coverage for {activeCompany.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsAddBuildingModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Building / Society
          </button>

          <button
            onClick={() => {
              setTargetBuildingIdForAdd(allBuildingsList[0]?.id || '');
              setIsAddLiftModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Lift
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Building Name / Address / Society..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F8FA] hover:bg-slate-100 focus:bg-white text-slate-800 text-xs font-medium placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#1976D2] focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Building Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBuildings.map((bld) => (
          <div
            key={bld.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div>
              {/* Header with Name & Zone */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{bld.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[240px]">{bld.address}</span>
                  </p>
                </div>
              </div>

              {/* Details Box */}
              <div className="mt-4 space-y-2 bg-[#F5F8FA] p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Client / Society:</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">{bld.client}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Elevator Units:</span>
                  <span className="font-bold text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {bld.numberOfLifts} Lifts
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">AMC Status:</span>
                  <span className="font-semibold text-emerald-700">{bld.amcStatus}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Service Status:</span>
                  <span className="font-semibold text-slate-800">{bld.serviceStatus}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setSelectedBuildingForView(bld)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToLifts) {
                    onNavigateToLifts(bld.id);
                  } else {
                    window.location.hash = 'lifts';
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1976D2] font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View Lifts</span>
              </button>

              <button
                onClick={() => {
                  setTargetBuildingIdForAdd(bld.id);
                  setIsAddLiftModalOpen(true);
                }}
                className="p-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold transition-colors"
                title="Add Lift to Building"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Building Modal */}
      {isAddBuildingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddBuildingModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Register New Building / Society</h3>
                <p className="text-xs text-slate-500">Add property site for any company, society, or commercial complex</p>
              </div>
            </div>

            <form onSubmit={handleCreateBuildingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Building / Society / Complex Name *</label>
                <input
                  type="text"
                  required
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  placeholder="e.g. Imperial Heights CHS (Tower A-D)"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Street Address & Landmark *</label>
                <input
                  type="text"
                  required
                  value={newBldAddress}
                  onChange={(e) => setNewBldAddress(e.target.value)}
                  placeholder="e.g. Sector 18, Palm Beach Road, Vashi"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={newBldCity}
                    onChange={(e) => setNewBldCity(e.target.value)}
                    placeholder="Mumbai / Pune / Bengaluru"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={newBldPin}
                    onChange={(e) => setNewBldPin(e.target.value)}
                    placeholder="400703"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client / Managing Entity</label>
                <input
                  type="text"
                  value={newBldClient}
                  onChange={(e) => setNewBldClient(e.target.value)}
                  placeholder="e.g. Imperial Heights Cooperative Housing Society"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newBldContactPerson}
                    onChange={(e) => setNewBldContactPerson(e.target.value)}
                    placeholder="Secretary / Facility Head"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newBldPhone}
                    onChange={(e) => setNewBldPhone(e.target.value)}
                    placeholder="+91 98201 00000"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBuildingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Register Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lift Modal */}
      {isAddLiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddLiftModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Add Elevator Unit</h3>
                <p className="text-xs text-slate-500">Register new lift shaft & configure specifications</p>
              </div>
            </div>

            <form onSubmit={handleAddLiftSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Building / Site</label>
                <select
                  value={targetBuildingIdForAdd}
                  onChange={(e) => setTargetBuildingIdForAdd(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold outline-none"
                >
                  {allBuildingsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lift Plate / Number</label>
                  <input
                    type="text"
                    required
                    value={liftNumber}
                    onChange={(e) => setLiftNumber(e.target.value)}
                    placeholder="e.g. WEP-001"
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lift Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LiftType)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none"
                  >
                    <option value="Passenger">Passenger</option>
                    <option value="Hospital Stretcher">Hospital Stretcher</option>
                    <option value="Freight / Goods">Freight / Goods</option>
                    <option value="Hydraulic">Hydraulic</option>
                    <option value="Capsule">Panoramic Capsule</option>
                    <option value="Home Lift">Home Lift</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand / Make</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Capacity (Pax)</label>
                  <input
                    type="number"
                    value={capacityPersons}
                    onChange={(e) => setCapacityPersons(Number(e.target.value))}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weight (Kg)</label>
                  <input
                    type="number"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Number(e.target.value))}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stops</label>
                  <input
                    type="number"
                    value={stops}
                    onChange={(e) => setStops(Number(e.target.value))}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Building Details Modal */}
      {selectedBuildingForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setSelectedBuildingForView(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold text-lg">
                <BuildingIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedBuildingForView.name}</h3>
                <p className="text-xs text-slate-500">{selectedBuildingForView.zone}</p>
              </div>
            </div>

            <div className="space-y-3 bg-[#F5F8FA] p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Society / Client:</span>
                <span className="font-bold text-slate-900">{selectedBuildingForView.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="font-medium text-slate-800 text-right max-w-[240px]">{selectedBuildingForView.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Installed Elevator Units:</span>
                <span className="font-bold text-[#1976D2]">{selectedBuildingForView.numberOfLifts} Lifts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AMC Contract Tier:</span>
                <span className="font-bold text-emerald-700">{selectedBuildingForView.amcStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Status:</span>
                <span className="font-bold text-slate-900">{selectedBuildingForView.serviceStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Inspection:</span>
                <span className="font-bold text-slate-900">{selectedBuildingForView.lastInspection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Next Scheduled PM Visit:</span>
                <span className="font-bold text-blue-700">{selectedBuildingForView.nextPM}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedBuildingForView(null)}
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
