import React, { useState } from 'react';
import {
  Package,
  Plus,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  Boxes,
} from 'lucide-react';
import { TechnicianJob, TechnicianPartItem, InventoryItem, PartCondition } from '../../types';

interface PartsManagerViewProps {
  job: TechnicianJob;
  inventory: InventoryItem[];
  onUpdateJobParts: (parts: TechnicianPartItem[]) => void;
  onConsumeInventoryPart: (partId: string, quantity: number, refId?: string, techName?: string) => void;
  onRestockInventoryPart: (partId: string, quantity: number, poNumber?: string) => void;
  onNavigateToTab: (tab: string) => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

const PART_CONDITIONS: PartCondition[] = [
  'Brand New (OEM)',
  'Tested / Working',
  'Worn Out / Fatigued',
  'Burnt / Electrical Failure',
  'Mechanically Damaged',
  'Missing / Broken',
];

export const PartsManagerView: React.FC<PartsManagerViewProps> = ({
  job,
  inventory,
  onUpdateJobParts,
  onConsumeInventoryPart,
  onRestockInventoryPart,
  onNavigateToTab,
  showToast,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(inventory[0]?.id || '');
  const [customPartName, setCustomPartName] = useState('');
  const [customPartNumber, setCustomPartNumber] = useState('');
  const [customCategory, setCustomCategory] = useState('Safety Devices');
  const [issuedQty, setIssuedQty] = useState(1);
  const [unitCost, setUnitCost] = useState(1850);
  const [warranty, setWarranty] = useState('12 Months OEM Warranty');
  const [serialNumber, setSerialNumber] = useState('');
  const [replacementReason, setReplacementReason] = useState('Periodic wear-and-tear replacement');
  const [oldCondition, setOldCondition] = useState<PartCondition>('Worn Out / Fatigued');
  const [newCondition, setNewCondition] = useState<PartCondition>('Brand New (OEM)');

  // Inventory Quick Picker selection change
  const handleInventorySelect = (id: string) => {
    setSelectedInventoryId(id);
    const item = inventory.find((i) => i.id === id);
    if (item) {
      setCustomPartName(item.name);
      setCustomPartNumber(item.partNumber);
      setCustomCategory(item.category.toUpperCase());
      setUnitCost(item.sellingPrice);
      setWarranty('12 Months OEM Replacement');
    }
  };

  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partName = customPartName.trim() || 'Elevator Spare Component';
    const partNum = customPartNumber.trim() || `WEP-SKU-${Math.floor(100 + Math.random() * 900)}`;

    const newPart: TechnicianPartItem = {
      id: `p-${Date.now()}`,
      partId: selectedInventoryId || `inv-${Date.now()}`,
      partName,
      partNumber: partNum,
      category: customCategory,
      quantityIssued: issuedQty,
      quantityUsed: issuedQty,
      quantityReturned: 0,
      unitCost,
      totalCost: issuedQty * unitCost,
      warranty,
      serialNumber: serialNumber || `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      reasonForReplacement: replacementReason,
      oldPartCondition: oldCondition,
      newPartCondition: newCondition,
      inventoryReference: 'Issued from Field Inventory Stock',
    };

    const jobParts = job?.parts || [];
    const updatedParts = [...jobParts, newPart];
    onUpdateJobParts(updatedParts);

    // Synchronize central inventory
    if (selectedInventoryId) {
      onConsumeInventoryPart(selectedInventoryId, issuedQty, job?.jobId || 'JOB-ACTIVE', job?.technicianName || 'Technician');
    }

    setIsAddModalOpen(false);
    showToast('success', 'Part Logged & Stock Deducted', `Added ${issuedQty}x ${partName} to job consumption ledger.`);
  };

  const jobParts = job?.parts || [];

  const handleReturnPart = (partId: string) => {
    const targetPart = jobParts.find((p) => p.id === partId);
    if (!targetPart || targetPart.quantityUsed <= 0) return;

    const returnQty = prompt(`How many units of ${targetPart.partName} are you returning to store/van stock?`, '1');
    const numReturn = parseInt(returnQty || '0', 10);

    if (numReturn > 0 && numReturn <= targetPart.quantityUsed) {
      const updatedParts = jobParts.map((p) => {
        if (p.id === partId) {
          const newUsed = p.quantityUsed - numReturn;
          const newReturned = p.quantityReturned + numReturn;
          return {
            ...p,
            quantityUsed: newUsed,
            quantityReturned: newReturned,
            totalCost: newUsed * p.unitCost,
          };
        }
        return p;
      });

      onUpdateJobParts(updatedParts);
      onRestockInventoryPart(targetPart.partId, numReturn, `RET-${job?.jobId || 'RET'}`);
      showToast('success', 'Part Returned to Van Stock', `Returned ${numReturn}x ${targetPart.partName} to inventory.`);
    }
  };

  const handleRemovePart = (partId: string) => {
    if (confirm('Remove this part from the job consumption record?')) {
      const updatedParts = jobParts.filter((p) => p.id !== partId);
      onUpdateJobParts(updatedParts);
      showToast('info', 'Part Removed', 'Item removed from job parts ledger.');
    }
  };

  const totalPartsCost = jobParts.reduce((acc, p) => acc + p.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Spare Parts Used & Returned</h2>
              <p className="text-xs text-slate-500">
                Track Van Stock consumption, OEM replacement serials, old part condition & returns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log / Add Spare Part</span>
            </button>
          </div>
        </div>

        {/* Cost Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Parts Logged</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{jobParts.length} Components</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Parts Consumption Value</span>
            <span className="text-sm font-black text-[#1976D2] mt-0.5 block">
              ₹ {totalPartsCost.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">AMC Billing Coverage</span>
            <span className="text-sm font-black text-emerald-700 mt-0.5 block">100% Covered under Comprehensive AMC</span>
          </div>
        </div>
      </div>

      {/* Parts List Cards */}
      {jobParts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Spare Parts Replaced Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            If you replaced or tested any mechanical, electrical, or sensor components, log them above to maintain inventory accuracy.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs"
          >
            + Add Spare Part
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobParts.map((part) => (
            <div
              key={part.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900">{part.partName}</span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      SKU: {part.partNumber}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {part.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Serial: <strong className="font-mono text-slate-600">{part.serialNumber || 'N/A'}</strong> • Loc: {part.inventoryReference}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    ₹ {part.totalCost.toLocaleString('en-IN')}
                  </span>

                  {part.quantityUsed > 0 && (
                    <button
                      onClick={() => handleReturnPart(part.id)}
                      title="Return unused parts to van stock"
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRemovePart(part.id)}
                    title="Remove item"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quantities & Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Issued Qty</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">{part.quantityIssued}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Used in Job</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{part.quantityUsed}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Returned Qty</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">{part.quantityReturned}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Unit Cost</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">₹{part.unitCost}</span>
                </div>
              </div>

              {/* Condition & Replacement Justification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Reason for Replacement</span>
                  <p className="font-medium text-slate-700 mt-0.5">{part.reasonForReplacement}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Old Part Condition</span>
                  <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-0.5 inline-block text-[11px]">
                    {part.oldPartCondition}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">New Part Condition</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block text-[11px]">
                    {part.newPartCondition}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => onNavigateToTab('diagnosis')}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
        >
          ← Back to Diagnosis
        </button>

        <button
          onClick={() => onNavigateToTab('photos')}
          className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-2"
        >
          <span>Proceed to Evidence Photos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add Part Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1976D2]" />
                <h3 className="text-base font-black text-slate-900">Add Spare Part to Job</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPartSubmit} className="space-y-4">
              {/* Quick Select from Store Inventory */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Select from Central Warehouse Inventory
                </label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => handleInventorySelect(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 font-semibold"
                >
                  <option value="">-- Choose Stock SKU / Component --</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.partNumber} • {inv.name} (Stock: {inv.currentStock} {inv.unit} • ₹{inv.sellingPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Part Name & SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Part Name *</label>
                  <input
                    type="text"
                    required
                    value={customPartName}
                    onChange={(e) => setCustomPartName(e.target.value)}
                    placeholder="e.g. Landing Door Interlock Switch"
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Part Number / SKU *</label>
                  <input
                    type="text"
                    required
                    value={customPartNumber}
                    onChange={(e) => setCustomPartNumber(e.target.value)}
                    placeholder="e.g. WEP-SW-LCK102"
                    className="w-full p-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quantity, Unit Cost & Serial */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={issuedQty}
                    onChange={(e) => setIssuedQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Serial / Batch No</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="SN-2026-..."
                    className="w-full p-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:bg-white"
                  />
                </div>
              </div>

              {/* Reason for Replacement */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Reason for Replacement *
                </label>
                <input
                  type="text"
                  required
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  placeholder="e.g. Intermittent safety circuit contact trip"
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white"
                />
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Old Part Condition *
                  </label>
                  <select
                    value={oldCondition}
                    onChange={(e) => setOldCondition(e.target.value as PartCondition)}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {PART_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    New Part Condition *
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as PartCondition)}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {PART_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black shadow-sm"
                >
                  Save & Log Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
