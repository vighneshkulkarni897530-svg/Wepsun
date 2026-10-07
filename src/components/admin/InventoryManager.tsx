import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Sparkles,
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
  User,
  ShieldCheck,
  Building,
  Wrench,
  DollarSign,
  BarChart3,
  Truck,
  Printer,
  FileSpreadsheet,
  Layers,
  Phone,
  Mail,
  Edit,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, InventoryMovementType } from '../../types';

export const InventoryManager: React.FC = () => {
  const {
    tenantInventory,
    tenantMovements,
    tenantTechnicians,
    tenantLifts,
    restockInventoryPart,
    recordInventoryMovement,
    addNewInventoryItem,
    updateInventoryItem,
    activeCompany,
    showToast,
    showSuccessModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'stock' | 'low_stock' | 'tech_issued' | 'job_consumed' | 'suppliers' | 'movements' | 'reports'
  >('stock');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('All');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('All');

  // Record Transaction Modal
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [movementType, setMovementType] = useState<InventoryMovementType>('PURCHASE');
  const [movementQty, setMovementQty] = useState<number>(5);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Add New Spare Part Modal
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartSku, setNewPartSku] = useState('');
  const [newPartCategory, setNewPartCategory] = useState<InventoryItem['category']>('mechanical');
  const [newPartStock, setNewPartStock] = useState<number>(5);
  const [newPartMinStock, setNewPartMinStock] = useState<number>(2);
  const [newPartUnit, setNewPartUnit] = useState<InventoryItem['unit']>('Nos');
  const [newPartPurchasePrice, setNewPartPurchasePrice] = useState<number>(1500);
  const [newPartSellingPrice, setNewPartSellingPrice] = useState<number>(2500);
  const [newPartHsn, setNewPartHsn] = useState('84313100');
  const [newPartSupplier, setNewPartSupplier] = useState('Fermator India Components Pvt. Ltd.');
  const [newPartRack, setNewPartRack] = useState('Rack M-02 (Central Store)');
  const [newPartCompatible, setNewPartCompatible] = useState('WEPSUN MRL, Otis Gen2, Monarch NICE3000+');

  const categories = ['All', 'electrical', 'mechanical', 'electronic', 'safety', 'consumable'];

  // Calculations for KPI summary cards
  const totalSkuCount = tenantInventory.length;
  const totalStockUnits = tenantInventory.reduce((acc, i) => acc + i.currentStock, 0);
  const totalValuationCost = tenantInventory.reduce((acc, i) => acc + i.currentStock * i.purchasePrice, 0);
  const totalValuationSelling = tenantInventory.reduce((acc, i) => acc + i.currentStock * i.sellingPrice, 0);
  const lowStockItems = tenantInventory.filter((i) => i.currentStock <= i.minStockThreshold);

  // Filtered views
  const filteredItems = tenantInventory.filter((item) => {
    const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationRack.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredMovements = tenantMovements.filter((mov) => {
    const matchType = movementTypeFilter === 'All' || mov.type === movementTypeFilter;
    const matchSearch =
      mov.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mov.referenceId && mov.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const techIssuedMovements = tenantMovements.filter((mov) => mov.type === 'TECHNICIAN_ISSUE');
  const jobConsumedMovements = tenantMovements.filter((mov) => mov.type === 'JOB_CONSUMPTION');

  // Supplier directory extracted from items & initial suppliers
  const suppliersList = [
    {
      id: 'sup-1',
      name: 'Monarch Inovance Technology India Ltd.',
      contactPerson: 'Mr. Arvind Gupta',
      phone: '+91 98201 11223',
      email: 'sales@inovance.in',
      gstin: '27AABCI1234F1Z8',
      city: 'Navi Mumbai',
      specialty: 'Integrated Inverter Controllers, Drives & PG Cards',
      paymentTerms: '30 Days Net',
      itemsCount: tenantInventory.filter((i) => i.supplier.includes('Monarch') || i.supplier.includes('Inovance')).length || 2,
    },
    {
      id: 'sup-2',
      name: 'Fermator India Components Pvt. Ltd.',
      contactPerson: 'Ms. Sunita Patil',
      phone: '+91 98202 33445',
      email: 'orders@fermator.in',
      gstin: '27AABCF5678G2Z1',
      city: 'Pune',
      specialty: 'Door Operators, Clutch Knives & Lock Interlocks',
      paymentTerms: '45 Days Net',
      itemsCount: tenantInventory.filter((i) => i.supplier.includes('Fermator')).length || 2,
    },
    {
      id: 'sup-3',
      name: 'Exide Industries Industrial Power',
      contactPerson: 'Mr. Vikram Sen',
      phone: '+91 98203 55667',
      email: 'industrial@exide.co.in',
      gstin: '27AABCE9012H3Z4',
      city: 'Mumbai',
      specialty: '12V SMF Batteries & High Capacity ARD Power Banks',
      paymentTerms: '15 Days Net',
      itemsCount: tenantInventory.filter((i) => i.supplier.includes('Exide')).length || 1,
    },
    {
      id: 'sup-4',
      name: 'Dewhurst Elevator Fixtures Ltd.',
      contactPerson: 'Mr. Rajesh Nambiar',
      phone: '+91 98204 77889',
      email: 'support@dewhurst.co.in',
      gstin: '27AABCD3456I4Z7',
      city: 'Chennai',
      specialty: 'Braille Push Buttons, Hall LOPs & Position Displays',
      paymentTerms: '30 Days Net',
      itemsCount: tenantInventory.filter((i) => i.supplier.includes('Dewhurst')).length || 1,
    },
    {
      id: 'sup-5',
      name: 'Castrol Industrial Lubricants',
      contactPerson: 'Mr. Pradeep Joshi',
      phone: '+91 98205 99001',
      email: 'sales@castrol.in',
      gstin: '27AABCC7890J5Z0',
      city: 'Thane',
      specialty: 'ISO VG 68 Guide Rail Oils & Gearbox Synthetic Greases',
      paymentTerms: 'Immediate',
      itemsCount: tenantInventory.filter((i) => i.supplier.includes('Castrol')).length || 1,
    },
    {
      id: 'sup-6',
      name: 'Binder Magnete India Ltd.',
      contactPerson: 'Mr. Sandeep Rathi',
      phone: '+91 98206 12345',
      email: 'info@binder-magnete.in',
      gstin: '27AABCB2345K6Z3',
      city: 'Pune',
      specialty: 'Brake Coils, Rectifiers & Electromagnetic Actuators',
      paymentTerms: '30 Days Net',
      itemsCount: tenantInventory.filter((i) => i.supplier.includes('Binder')).length || 1,
    },
  ];

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = tenantInventory.find((i) => i.id === selectedPartId);
    if (!item) return;

    const tech = tenantTechnicians.find((t) => t.id === selectedTechId);
    const prevStock = item.currentStock;
    let qty = Number(movementQty);
    let newStock = prevStock;

    if (movementType === 'PURCHASE' || movementType === 'RETURN') {
      newStock = prevStock + qty;
    } else if (movementType === 'TECHNICIAN_ISSUE' || movementType === 'JOB_CONSUMPTION') {
      qty = -qty;
      newStock = Math.max(0, prevStock + qty);
    } else if (movementType === 'ADJUSTMENT') {
      newStock = qty;
      qty = newStock - prevStock;
    }

    recordInventoryMovement({
      companyId: item.companyId || activeCompany.id,
      branchId: item.branchId || 'br-thn-1',
      partId: item.id,
      partNumber: item.partNumber,
      partName: item.name,
      type: movementType,
      quantity: qty,
      previousStock: prevStock,
      newStock,
      referenceId: referenceNo || 'MANUAL-ENTRY',
      technicianId: tech?.id,
      technicianName: tech?.name,
      performedBy: 'Store & Inventory Manager',
      notes: notes || `Recorded ${movementType} transaction against ${item.partNumber}.`,
    });

    setIsMovementModalOpen(false);
    setSelectedPartId('');
    setReferenceNo('');
    setNotes('');
  };

  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;

    addNewInventoryItem({
      name: newPartName,
      partNumber: newPartSku || `WPS-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newPartCategory,
      currentStock: Number(newPartStock),
      minStockThreshold: Number(newPartMinStock),
      unit: newPartUnit,
      purchasePrice: Number(newPartPurchasePrice),
      sellingPrice: Number(newPartSellingPrice),
      hsnCode: newPartHsn || '84313100',
      supplier: newPartSupplier,
      locationRack: newPartRack,
      compatibleModels: newPartCompatible.split(',').map((s) => s.trim()),
    });

    const addedItemName = newPartName;
    setIsAddPartModalOpen(false);
    setNewPartName('');
    setNewPartSku('');
    showSuccessModal(
      'Inventory Item Added',
      `"${addedItemName}" has been successfully added to central warehouse stock.`
    );
  };

  const getMovementBadge = (type: InventoryMovementType) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-[#2E7D32] border border-emerald-200 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> PURCHASE (+)
          </span>
        );
      case 'RETURN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-blue-100 text-[#1976D2] border border-blue-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-[#1976D2]" /> RETURN (+)
          </span>
        );
      case 'TECHNICIAN_ISSUE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-[#F9A825] border border-amber-200 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-[#F9A825]" /> TECH ISSUE (-)
          </span>
        );
      case 'JOB_CONSUMPTION':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Package className="w-3 h-3 text-purple-600" /> JOB CONSUMED (-)
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            ADJUSTMENT (±)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Header Banner matching PRD Section 9 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#123B5D] text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/20 shrink-0">
              <Package className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-blue-100 text-[#1976D2] font-mono text-[11px] font-bold uppercase tracking-wider border border-blue-200">
                  PRD SECTION 9 • INVENTORY & SPARE PARTS
                </span>
                <span className="text-xs text-slate-500 font-medium">• {activeCompany.name}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
                Elevator Spare Parts & Inventory Management System
              </h1>
              <p className="text-xs text-slate-500">
                Track live stock, purchase costs, selling prices, minimum-stock alerts, van issues, and lift job consumption.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsAddPartModalOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-[#1976D2]" />
              <span>Add New Part</span>
            </button>
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-sky-300" />
              <span>Record Stock Movement</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Card 1: Total SKUs */}
          <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Total Catalog SKUs</span>
            <span className="text-2xl font-black font-mono text-slate-900 block">{totalSkuCount} Parts</span>
            <span className="text-[11px] text-slate-500">{totalStockUnits} Total units in store</span>
          </div>

          {/* Card 2: Low Stock Alerts */}
          <div
            onClick={() => setActiveTab('low_stock')}
            className={`border rounded-2xl p-4 space-y-1 cursor-pointer transition-all ${
              lowStockItems.length > 0
                ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-[#F5F8FA] border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-[10px] uppercase font-mono font-bold text-amber-700 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Min-Stock Alerts
            </span>
            <span className="text-2xl font-black font-mono text-amber-600 block">
              {lowStockItems.length} Urgent Reorders
            </span>
            <span className="text-[11px] font-semibold text-amber-800">Below safety threshold</span>
          </div>

          {/* Card 3: Stock Valuation (Cost) */}
          <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Stock Value (At Cost)</span>
            <span className="text-2xl font-black font-mono text-[#1976D2] block">
              ₹{totalValuationCost.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500">Inventory asset value</span>
          </div>

          {/* Card 4: Retail Value */}
          <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Retail Quotation Value</span>
            <span className="text-2xl font-black font-mono text-emerald-600 block">
              ₹{totalValuationSelling.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold">
              +₹{(totalValuationSelling - totalValuationCost).toLocaleString('en-IN')} Profit potential
            </span>
          </div>
        </div>

        {/* 7 Navigation Tabs matching PRD Section 9 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-thin">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stock'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Live Stock Catalog ({tenantInventory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('low_stock')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'low_stock'
                ? 'bg-[#D32F2F] text-white shadow-sm'
                : lowStockItems.length > 0
                ? 'bg-red-50 hover:bg-red-100 text-[#D32F2F] border border-red-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>2. Min-Stock Alerts ({lowStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tech_issued')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tech_issued'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>3. Issued to Technicians ({techIssuedMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('job_consumed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'job_consumed'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Job Consumption Ledger ({jobConsumedMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'suppliers'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>5. Suppliers & Purchase Records ({suppliersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'movements'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>6. Full Audit Ledger ({tenantMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'reports'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>7. Stock & Consumption Reports</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Live Stock Catalog (PRD: Parts inventory and stock levels, Purchase price and selling price) */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search part name, SKU number, storage rack, supplier..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none capitalize font-medium focus:bg-white focus:border-[#1976D2]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Showing <strong className="text-slate-900">{filteredItems.length}</strong> of {tenantInventory.length} parts
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Part SKU & Component Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Storage Location</th>
                  <th className="p-3.5 text-center">Current Stock</th>
                  <th className="p-3.5 text-right">Purchase Price</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  <th className="p-3.5 text-center">Margin</th>
                  <th className="p-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLowStock = item.currentStock <= item.minStockThreshold;
                  const marginPct = Math.round(((item.sellingPrice - item.purchasePrice) / item.sellingPrice) * 100);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/50 text-slate-700 transition-colors ${
                        isLowStock ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-sans text-sm">{item.name}</div>
                        <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                          <span className="text-[#1976D2] font-semibold">{item.partNumber}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">HSN: {item.hsnCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                          Fit: {item.compatibleModels?.join(', ') || 'Universal'}
                        </div>
                      </td>

                      <td className="p-3.5 font-sans capitalize text-slate-700">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600 font-sans">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1976D2] shrink-0" />
                          <span className="font-medium text-slate-800">{item.locationRack}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.supplier}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                              isLowStock
                                ? 'bg-red-100 text-[#D32F2F] border border-red-200'
                                : 'bg-emerald-100 text-[#2E7D32]'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Min Threshold: {item.minStockThreshold}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right text-slate-600 font-mono font-medium">
                        ₹{item.purchasePrice.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                        ₹{item.sellingPrice.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{marginPct}%
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPartId(item.id);
                              setMovementType('PURCHASE');
                              setMovementQty(10);
                              setIsMovementModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1976D2] text-xs font-bold border border-blue-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Restock
                          </button>

                          <button
                            onClick={() => {
                              setSelectedPartId(item.id);
                              setMovementType('TECHNICIAN_ISSUE');
                              setMovementQty(1);
                              setIsMovementModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5 text-amber-600" />
                            Issue
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Minimum-Stock Alerts (PRD: Minimum-stock alerts) */}
      {activeTab === 'low_stock' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Critical Safety Minimum-Stock Alerts</span>
              </h2>
              <p className="text-xs text-slate-500">
                Immediate purchase order requisition recommended for critical elevator breakdown components.
              </p>
            </div>

            <button
              onClick={() => {
                showToast('success', 'Bulk PO Generated', 'Purchase orders drafted for all 2 low-stock suppliers.');
              }}
              className="px-4 py-2 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate Bulk Purchase Order</span>
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              All spare parts are currently above safety stock minimum thresholds.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-red-50/40 border border-red-200 rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[10px] font-bold uppercase">
                        CRITICAL SHORTAGE
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{item.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{item.partNumber} • Category: {item.category}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-red-700 font-bold block">Current Stock</span>
                      <span className="text-2xl font-black font-mono text-[#D32F2F]">
                        {item.currentStock} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">Safety Min: {item.minStockThreshold}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-red-100 text-xs space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Preferred Supplier:</span>
                      <span className="font-semibold text-slate-900">{item.supplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Purchase Price / Unit:</span>
                      <span className="font-bold font-mono text-slate-900">₹{item.purchasePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recommended Reorder Qty:</span>
                      <span className="font-bold font-mono text-emerald-700">{item.minStockThreshold * 3} {item.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedPartId(item.id);
                        setMovementType('PURCHASE');
                        setMovementQty(item.minStockThreshold * 3);
                        setReferenceNo(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
                        setIsMovementModalOpen(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 text-center"
                    >
                      Instant Restock PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Parts Issued to Technicians (PRD: Parts issued to technicians) */}
      {activeTab === 'tech_issued' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Field Engineer Van Stock & Issued Parts</h2>
              <p className="text-xs text-slate-500">Track spare parts handed over to technicians for field repair kits</p>
            </div>

            <button
              onClick={() => {
                setMovementType('TECHNICIAN_ISSUE');
                setIsMovementModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-sky-300" />
              <span>Issue Parts to Technician</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Issue Timestamp</th>
                  <th className="p-3.5">Technician / Engineer</th>
                  <th className="p-3.5">Part SKU & Name</th>
                  <th className="p-3.5 text-center">Qty Issued</th>
                  <th className="p-3.5">Dispatch Ref #</th>
                  <th className="p-3.5">Remarks / Van Kit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {techIssuedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No technician checkout records recorded yet.
                    </td>
                  </tr>
                ) : (
                  techIssuedMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50 text-slate-700">
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(mov.timestamp).toLocaleDateString()}{' '}
                        <span className="text-slate-400">
                          {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#1976D2]" />
                          <span>{mov.technicianName || 'Rajesh Sharma'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{mov.partName}</div>
                        <div className="text-[10px] font-mono text-[#1976D2]">{mov.partNumber}</div>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#F9A825] font-bold text-xs">
                          {Math.abs(mov.quantity)} Units
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {mov.referenceId || 'VAN-KIT'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500">{mov.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Parts Consumed on Lift Jobs (PRD: Parts consumed against a specific lift/job) */}
      {activeTab === 'job_consumed' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lift Breakdown & Job Parts Consumption Ledger</h2>
              <p className="text-xs text-slate-500">
                Detailed record of all components replaced on site linked to tickets, lifts, and work orders
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Job Date</th>
                  <th className="p-3.5">Ticket / Work Order</th>
                  <th className="p-3.5">Spare Part Replaced</th>
                  <th className="p-3.5 text-center">Qty Consumed</th>
                  <th className="p-3.5">Fitted by Tech</th>
                  <th className="p-3.5">Job Details / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobConsumedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No job consumption recorded yet. Parts will show automatically when technicians close service tickets.
                    </td>
                  </tr>
                ) : (
                  jobConsumedMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50 text-slate-700">
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(mov.timestamp).toLocaleDateString()}
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {mov.referenceId || 'TKT-2026-0412'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{mov.partName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{mov.partNumber}</div>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                          {Math.abs(mov.quantity)} Units
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">{mov.technicianName || 'Deepak Patil'}</td>

                      <td className="p-3.5 text-slate-500">{mov.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Suppliers & Purchase Records (PRD: Purchase and supplier records) */}
      {activeTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Approved Elevator Component Suppliers</h2>
              <p className="text-xs text-slate-500">
                OEM manufacturers, authorized drive distributors, and raw material vendor records
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliersList.map((sup) => (
              <div
                key={sup.id}
                className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:border-blue-300 hover:bg-white transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                    <p className="text-xs text-[#1976D2] font-semibold mt-0.5">{sup.specialty}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#2E7D32] font-bold text-[10px] font-mono">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/80 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact: <strong className="text-slate-800">{sup.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-500">
                    <span>GSTIN: {sup.gstin}</span>
                    <span className="text-[#1976D2] font-bold">Terms: {sup.paymentTerms}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {sup.itemsCount} Catalog Spares Sourced
                  </span>
                  <button
                    onClick={() => {
                      setMovementType('PURCHASE');
                      setIsMovementModalOpen(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1976D2] text-xs font-bold border border-blue-200 transition-colors"
                  >
                    Raise PO Requisition
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Full Audit Ledger */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by part, technician, PO#, ticket#..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-medium focus:bg-white focus:border-[#1976D2]"
              >
                <option value="All">All Movements</option>
                <option value="PURCHASE">Purchases (+)</option>
                <option value="TECHNICIAN_ISSUE">Technician Issues (-)</option>
                <option value="JOB_CONSUMPTION">Job Consumptions (-)</option>
                <option value="RETURN">Returns (+)</option>
                <option value="ADJUSTMENT">Adjustments (±)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5">Part Details</th>
                  <th className="p-3.5 text-center">Qty Changed</th>
                  <th className="p-3.5 text-center">Stock Balance</th>
                  <th className="p-3.5">Ref / Ticket / PO</th>
                  <th className="p-3.5">User / Tech</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 text-slate-700">
                    <td className="p-3.5 text-[11px] text-slate-500 whitespace-nowrap font-mono">
                      {new Date(mov.timestamp).toLocaleDateString()}{' '}
                      <span className="text-slate-400">
                        {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-3.5">{getMovementBadge(mov.type)}</td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 font-sans">{mov.partName}</div>
                      <div className="text-[10px] text-[#1976D2] font-mono">{mov.partNumber}</div>
                    </td>

                    <td className="p-3.5 text-center font-mono">
                      <span
                        className={`text-xs font-bold ${
                          mov.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-mono">
                      <span className="text-slate-500">{mov.previousStock}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-slate-900 font-bold">{mov.newStock}</span>
                    </td>

                    <td className="p-3.5 text-slate-700 font-mono">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {mov.referenceId || 'N/A'}
                      </span>
                    </td>

                    <td className="p-3.5 font-sans text-slate-700">
                      <div className="font-medium">{mov.performedBy}</div>
                      {mov.technicianName && (
                        <div className="text-[10px] text-[#1976D2] font-mono flex items-center gap-1">
                          <User className="w-2.5 h-2.5" /> {mov.technicianName}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-sans text-xs text-slate-500 max-w-xs truncate">
                      {mov.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: Stock & Consumption Reports (PRD: Stock and consumption reports) */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Stock & Consumption Analytics Report</h2>
              <p className="text-xs text-slate-500">Executive breakdown of elevator spares turnover and replacement costs</p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200"
            >
              <Printer className="w-4 h-4 text-[#1976D2]" />
              <span>Print Inventory Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Inventory by Category</h3>
              <div className="space-y-2 text-xs">
                {['electrical', 'mechanical', 'electronic', 'safety', 'consumable'].map((cat) => {
                  const count = tenantInventory.filter((i) => i.category === cat).length;
                  const pct = Math.round((count / tenantInventory.length) * 100) || 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between capitalize">
                        <span className="text-slate-600">{cat}</span>
                        <span className="font-bold text-slate-900">{count} SKUs ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1976D2]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Top Consumed Elevator Spares</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Landing Door Interlocks</span>
                  <span className="font-bold font-mono text-[#1976D2]">14 Replaced</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Infrared Light Curtains</span>
                  <span className="font-bold font-mono text-[#1976D2]">8 Replaced</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">ARD 12V 26Ah Batteries</span>
                  <span className="font-bold font-mono text-[#1976D2]">6 Replaced</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Guide Rail VG 68 Oil</span>
                  <span className="font-bold font-mono text-[#1976D2]">25 Liters</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Financial Health & Audit</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Purchase Investment:</span>
                  <span className="font-bold font-mono text-slate-900">₹{totalValuationCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Retail Sales Potential:</span>
                  <span className="font-bold font-mono text-emerald-700">₹{totalValuationSelling.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Margin Target:</span>
                  <span className="font-bold font-mono text-[#1976D2]">
                    {Math.round(((totalValuationSelling - totalValuationCost) / totalValuationSelling) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600">
                  <span>Audited Warehouse:</span>
                  <span className="font-bold text-slate-900">Vashi Central Warehouse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Record Transaction Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-[#1976D2]" />
                Record Inventory Transaction
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Part SKU / Item *</label>
                <select
                  required
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-[#1976D2] outline-none"
                >
                  <option value="">Select Spare Part...</option>
                  {tenantInventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.partNumber} — {item.name} (Cur: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transaction Type *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as InventoryMovementType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                >
                  <option value="PURCHASE">PURCHASE (+) — Restock from Supplier</option>
                  <option value="TECHNICIAN_ISSUE">TECHNICIAN_ISSUE (-) — Issued to Van Kit</option>
                  <option value="JOB_CONSUMPTION">JOB_CONSUMPTION (-) — Consumed in Lift Repair</option>
                  <option value="RETURN">RETURN (+) — Unused Part Returned to Store</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (±) — Cycle Count Correction</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {movementType === 'ADJUSTMENT' ? 'New Exact Stock Level' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementQty}
                    onChange={(e) => setMovementQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reference PO / Ticket #</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-99"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              {(movementType === 'TECHNICIAN_ISSUE' || movementType === 'JOB_CONSUMPTION') && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Technician</label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-[#1976D2] outline-none"
                  >
                    <option value="">Select Technician...</option>
                    {tenantTechnicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="Reason for movement or batch receipt details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Spare Part Modal */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1976D2]" />
                Add New Spare Part to Catalog
              </h3>
              <button
                onClick={() => setIsAddPartModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPartSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Component / Spare Part Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VVVF Drive Cooling Fan 24V DC"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU Number / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. WEP-FAN-24V"
                    value={newPartSku}
                    onChange={(e) => setNewPartSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 capitalize focus:bg-white focus:border-[#1976D2] outline-none"
                  >
                    <option value="electrical">Electrical</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="electronic">Electronic</option>
                    <option value="safety">Safety</option>
                    <option value="consumable">Consumable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newPartStock}
                    onChange={(e) => setNewPartStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Safety Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newPartMinStock}
                    onChange={(e) => setNewPartMinStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit of Measure</label>
                  <select
                    value={newPartUnit}
                    onChange={(e) => setNewPartUnit(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Sets">Sets</option>
                    <option value="Meters">Meters</option>
                    <option value="Liters">Liters</option>
                    <option value="Rolls">Rolls</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPartPurchasePrice}
                    onChange={(e) => setNewPartPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling / Quote Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPartSellingPrice}
                    onChange={(e) => setNewPartSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={newPartSupplier}
                    onChange={(e) => setNewPartSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Storage Rack / Bay</label>
                  <input
                    type="text"
                    value={newPartRack}
                    onChange={(e) => setNewPartRack(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Compatible Lift Models</label>
                <input
                  type="text"
                  placeholder="e.g. Monarch NICE3000, Otis Gen2, Kone MonoSpace"
                  value={newPartCompatible}
                  onChange={(e) => setNewPartCompatible(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold shadow-md shadow-blue-900/20"
                >
                  Save to Inventory Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
