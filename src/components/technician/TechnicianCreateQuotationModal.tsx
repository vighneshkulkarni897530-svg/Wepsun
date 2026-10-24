import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Package,
  Wrench,
  Calculator,
  ShieldCheck,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { TechnicianJob, QuotationItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface TechnicianCreateQuotationModalProps {
  job: TechnicianJob;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TechnicianCreateQuotationModal: React.FC<TechnicianCreateQuotationModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { inventory, createQuotation, showToast, activeCompany } = useApp();

  const [subject, setSubject] = useState(
    `Spare Parts & Repair Estimation for Lift ${job.liftNumber} (${job.buildingName})`
  );
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: `item-${Date.now()}-1`,
      description: job.diagnosis ? `Defect Resolution: ${job.diagnosis}` : 'Shaft Safety & Mechanism Rectification',
      hsnCode: '84313100',
      quantity: 1,
      unitRate: 2500,
      amount: 2500,
    },
  ]);
  const [selectedInventoryPartId, setSelectedInventoryPartId] = useState('');
  const [remarks, setRemarks] = useState(
    job.recommendations || 'Recommended for immediate replacement to prevent recurrent shutdown.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPartFromInventory = () => {
    if (!selectedInventoryPartId) return;
    const invItem = inventory.find((i) => i.id === selectedInventoryPartId);
    if (!invItem) return;

    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: invItem.name,
        hsnCode: invItem.hsnCode || '84313100',
        quantity: 1,
        unitRate: invItem.sellingPrice || 1200,
        amount: invItem.sellingPrice || 1200,
      },
    ]);
    setSelectedInventoryPartId('');
  };

  const handleAddCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: 'Elevator Component / Calibration Service',
        hsnCode: '998719',
        quantity: 1,
        unitRate: 1500,
        amount: 1500,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'description' | 'quantity' | 'unitRate', value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitRate') {
            const q = field === 'quantity' ? Number(value) || 0 : item.quantity;
            const r = field === 'unitRate' ? Number(value) || 0 : item.unitRate;
            updated.amount = q * r;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const gstRate = 0.18; // 18% standard GST for elevator works
  const gstAmount = Math.round(subtotal * gstRate);
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('error', 'Item Required', 'Please add at least one line item to the quotation.');
      return;
    }

    setIsSubmitting(true);
    const newQuote = createQuotation({
      liftId: job.liftId,
      liftNumber: job.liftNumber,
      buildingId: job.buildingId,
      buildingName: job.buildingName,
      clientId: job.clientId,
      clientName: job.clientName,
      clientEmail: job.clientEmail,
      clientPhone: job.clientPhone,
      complaintId: job.id,
      subject,
      items,
      subtotal,
      gstRate: 18,
      gstAmount,
      grandTotal,
      status: 'pending',
      terms: [
        'Prices valid for 30 days from date of issue.',
        '100% advance on parts approval before dispatch.',
        'GST 18% applicable as per statutory elevator engineering codes.',
      ],
      notes: remarks,
    });

    setIsSubmitting(false);
    showToast('success', 'Quotation Submitted', `Quotation #${newQuote.quoteNumber} created and dispatched to Admin and Client.`);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92dvh] overflow-y-auto shadow-2xl relative text-slate-800 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#123B5D] to-[#1976D2] p-5 sm:p-6 text-white rounded-t-3xl relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/20 text-sky-200">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Create Repair Quotation</h2>
              <p className="text-xs text-sky-100">
                Generate itemized estimate with 18% GST linked to Job #{job.jobId} ({job.liftNumber})
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Site & Equipment</span>
              <p className="font-bold text-slate-900 mt-0.5">{job.buildingName}</p>
              <p className="text-[11px] text-[#1976D2] font-semibold">{job.liftNumber}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Client Account</span>
              <p className="font-bold text-slate-900 mt-0.5">{job.clientName}</p>
              <p className="text-[11px] text-slate-500">{job.clientPhone}</p>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Quotation Subject / Work Scope *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:border-[#1976D2] outline-none"
              placeholder="e.g. Replacement of Governor Tension Sheave and Door Cam"
            />
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Itemized Parts & Labor Breakdown</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> Custom Item
                </button>
              </div>
            </div>

            {/* Quick Add from Inventory dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Package className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedInventoryPartId}
                onChange={(e) => setSelectedInventoryPartId(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
              >
                <option value="">-- Add Spare Part from Central Inventory --</option>
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} (Stock: {inv.currentStock} {inv.unit} • ₹{inv.sellingPrice})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddPartFromInventory}
                disabled={!selectedInventoryPartId}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                  selectedInventoryPartId
                    ? 'bg-[#1976D2] hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                + Add Part
              </button>
            </div>

            {/* Table of items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 w-16 text-center">Qty</th>
                    <th className="p-2.5 w-24 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 w-24 text-right">Amount (₹)</th>
                    <th className="p-2.5 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full p-1.5 rounded bg-white border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                          className="w-14 p-1.5 rounded bg-white border border-slate-200 text-xs text-center font-bold focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.unitRate}
                          onChange={(e) => handleUpdateItem(item.id, 'unitRate', e.target.value)}
                          className="w-20 p-1.5 rounded bg-white border border-slate-200 text-xs text-right font-bold focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        ₹ {item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 max-w-xs ml-auto text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹ {subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% Statutory):</span>
                <span className="font-mono font-bold text-slate-900">₹ {gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-[#1976D2]">₹ {grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Technician Notes / Recommendation for Client *
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-[#1976D2] outline-none"
              placeholder="Provide technical justification for this quotation..."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Quotation for Approval'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
