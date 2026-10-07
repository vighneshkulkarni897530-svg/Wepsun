import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Building,
  Sparkles,
  X,
  CreditCard,
  Wrench,
  User,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Quotation, QuotationItem } from '../../types';

export const QuotationManager: React.FC = () => {
  const {
    tenantQuotations,
    tenantLifts,
    tenantInventory,
    tenantTechnicians,
    createQuotation,
    approveQuotation,
    convertQuotationToWorkOrder,
    activeCompany,
    showSuccessModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertingQuote, setConvertingQuote] = useState<Quotation | null>(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  // New quote state
  const [selectedLiftId, setSelectedLiftId] = useState(tenantLifts[0]?.id || '');
  const [subject, setSubject] = useState('Replacement of Door Interlock Switches & Calibration');
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 'item-1',
      description: 'Landing Door Lock Interlock Switch Assembly (Heavy Duty)',
      hsnCode: '85365090',
      quantity: 2,
      unitRate: 1850,
      amount: 3700,
    },
    {
      id: 'item-2',
      description: 'On-site Shaft Testing, Alignment & Re-certification Labor',
      hsnCode: '998719',
      quantity: 1,
      unitRate: 1500,
      amount: 1500,
    },
  ]);

  const targetLift = tenantLifts.find((l) => l.id === selectedLiftId) || tenantLifts[0];

  const filteredQuotes = tenantQuotations.filter(
    (q) =>
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItemFromInventory = (partId: string) => {
    const inv = tenantInventory.find((i) => i.id === partId);
    if (!inv) return;

    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: inv.name,
        hsnCode: inv.hsnCode,
        quantity: 1,
        unitRate: inv.sellingPrice,
        amount: inv.sellingPrice,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleItemRateChange = (id: string, rate: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, unitRate: rate, amount: item.quantity * rate } : item
      )
    );
  };

  const handleItemQtyChange = (id: string, qty: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: qty, amount: qty * item.unitRate } : item
      )
    );
  };

  const subtotal = items.reduce((acc, i) => acc + i.amount, 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount;

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLift) return;

    createQuotation({
      liftId: targetLift.id,
      liftNumber: targetLift.liftNumber,
      buildingName: targetLift.buildingName,
      clientId: targetLift.clientId,
      clientName: targetLift.clientName,
      clientEmail: 'society.manager@greenwood.com',
      clientPhone: targetLift.clientPhone,
      subject,
      items,
    });

    setIsAddModalOpen(false);
    showSuccessModal(
      'Quotation Generated Successfully!',
      `Official quotation for ${targetLift.liftNumber} (${targetLift.buildingName}) has been generated and queued for approval.`
    );
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingQuote) return;
    convertQuotationToWorkOrder(convertingQuote.id, selectedTechId, scheduledDate);
    setConvertingQuote(null);
    showSuccessModal(
      'Converted to Active Work Order!',
      `Quotation ${convertingQuote.quotationNumber} has been scheduled as an active field service task.`
    );
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quote number, society, elevator..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] focus:ring-1 focus:ring-[#1976D2] outline-none shadow-sm"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Repair Quotation
        </button>
      </div>

      {/* Quotations Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Quote No.</th>
              <th className="p-3.5">Lift & Society</th>
              <th className="p-3.5">Subject</th>
              <th className="p-3.5 text-right">Subtotal (₹)</th>
              <th className="p-3.5 text-right">Total Incl. GST</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredQuotes.map((q) => (
              <tr key={q.id} className="hover:bg-blue-50/50 text-slate-700 transition-colors">
                <td className="p-3.5 font-bold text-[#1976D2] font-mono">
                  <span className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {q.quoteNumber}
                  </span>
                </td>
                <td className="p-3.5 font-sans">
                  <div className="font-bold text-slate-900">{q.liftNumber}</div>
                  <div className="text-[11px] text-slate-500">{q.buildingName}</div>
                </td>
                <td className="p-3.5 font-sans max-w-xs">
                  <div className="font-medium text-slate-900 truncate">{q.subject}</div>
                  {q.clarificationNotes && (
                    <div className="text-[10px] text-amber-700 italic mt-0.5">
                      Note: &ldquo;{q.clarificationNotes}&rdquo;
                    </div>
                  )}
                </td>
                <td className="p-3.5 text-right text-slate-600 font-mono">
                  ₹{q.subtotal.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                  ₹{q.grandTotal.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                      q.status === 'approved'
                        ? 'bg-emerald-100 text-[#2E7D32]'
                        : q.status === 'converted_to_work_order'
                        ? 'bg-purple-100 text-purple-700'
                        : q.status === 'rejected'
                        ? 'bg-red-100 text-[#D32F2F]'
                        : q.status === 'clarification_requested'
                        ? 'bg-amber-100 text-[#F9A825]'
                        : 'bg-blue-100 text-[#1976D2]'
                    }`}
                  >
                    ● {q.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-3.5 text-right font-sans">
                  {q.status === 'sent_to_client' || q.status === 'draft' ? (
                    <button
                      onClick={() => approveQuotation(q.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  ) : q.status === 'approved' ? (
                    <button
                      onClick={() => setConvertingQuote(q)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Issue Work Order
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-purple-700 font-semibold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      WO Assigned
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Convert to Work Order Modal */}
      {convertingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#1976D2]" />
              Convert Quotation to Work Order
            </h3>

            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Quote Ref:</span>
                <span className="text-slate-900 font-bold">{convertingQuote.quoteNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Society:</span>
                <span className="text-slate-900">{convertingQuote.buildingName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Grand Total:</span>
                <span className="text-emerald-700 font-bold">
                  ₹{convertingQuote.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleConvertSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assign Lead Field Engineer *</label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-[#1976D2] outline-none"
                >
                  <option value="">Select Technician...</option>
                  {tenantTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employeeCode}) — {t.zone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scheduled Execution Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#123B5D] text-[11px] leading-relaxed">
                ✓ Converts quotation to an active Work Order.
                <br />
                ✓ Automatically generates Invoice with 18% GST.
                <br />
                ✓ Sends push notification to assigned technician.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingQuote(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Generate Work Order & Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-800 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Create Repair / Replacement Quotation
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized pricing with automatic GST 18% calculation
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Select Elevator</label>
                  <select
                    value={selectedLiftId}
                    onChange={(e) => setSelectedLiftId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none font-mono focus:border-[#1976D2]"
                  >
                    {tenantLifts.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.liftNumber} — {l.buildingName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Subject / Scope</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-[#1976D2]"
                    placeholder="e.g. Inverter replacement & brake calibration"
                  />
                </div>
              </div>

              {/* Add Part from Inventory Shortcut */}
              <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="font-semibold text-[#1976D2] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Quick-Add Part from Inventory
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemFromInventory(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 outline-none text-xs font-mono focus:border-[#1976D2]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a part from store inventory to auto-fill description & rate...
                  </option>
                  {tenantInventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.partNumber}) — ₹{i.sellingPrice.toLocaleString('en-IN')} (In Stock:{' '}
                      {i.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Itemized Breakdown</span>
                  <button
                    type="button"
                    onClick={() =>
                      setItems([
                        ...items,
                        {
                          id: `item-${Date.now()}`,
                          description: 'Custom Service / Part',
                          hsnCode: '998719',
                          quantity: 1,
                          unitRate: 1000,
                          amount: 1000,
                        },
                      ])
                    }
                    className="text-[#1976D2] hover:text-blue-700 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Custom Line Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F8FA] text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 w-24">HSN</th>
                        <th className="p-2.5 w-16 text-center">Qty</th>
                        <th className="p-2.5 w-28 text-right">Rate (₹)</th>
                        <th className="p-2.5 w-28 text-right">Amount (₹)</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-mono">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2 font-sans">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                setItems(
                                  items.map((i) =>
                                    i.id === item.id ? { ...i, description: e.target.value } : i
                                  )
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-900 focus:border-[#1976D2] outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.hsnCode}
                              onChange={(e) =>
                                setItems(
                                  items.map((i) =>
                                    i.id === item.id ? { ...i, hsnCode: e.target.value } : i
                                  )
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:border-[#1976D2] outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemQtyChange(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center text-slate-900 focus:border-[#1976D2] outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.unitRate}
                              onChange={(e) =>
                                handleItemRateChange(item.id, parseInt(e.target.value) || 0)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-right text-slate-900 focus:border-[#1976D2] outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 bg-[#F5F8FA] p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span className="text-amber-700 font-bold">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#1976D2] pt-1.5 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" /> Send Quotation to Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
