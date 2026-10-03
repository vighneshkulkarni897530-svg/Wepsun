import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
  Printer,
  Calendar,
  Download,
  AlertCircle,
  X,
  Send,
  Paperclip,
  Eye,
} from 'lucide-react';
import { Quotation } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadQuotationPdf } from '../../services/pdfGenerator';

interface QuotationApprovalViewProps {
  quotations?: Quotation[];
}

export const QuotationApprovalView: React.FC<QuotationApprovalViewProps> = ({ quotations }) => {
  const { clientScopedQuotations, approveQuotation, rejectQuotation, requestQuoteClarification, activeCompany } = useApp();
  const allQuotations = quotations || clientScopedQuotations;

  const [activeQuoteId, setActiveQuoteId] = useState<string>(allQuotations[0]?.id || '');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [attachmentFileName, setAttachmentFileName] = useState('');

  const activeQuote = allQuotations.find((q) => q.id === activeQuoteId) || allQuotations[0];

  if (allQuotations.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-500 text-xs shadow-sm space-y-3">
        <FileText className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="font-bold text-base text-slate-800">No Quotations Found</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          There are currently no open work estimates or proposals awaiting your approval.
        </p>
      </div>
    );
  }

  const handleApproveConfirm = () => {
    if (activeQuote) {
      approveQuotation(activeQuote.id);
      setIsApproveModalOpen(false);
    }
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeQuote) {
      rejectQuotation(activeQuote.id, rejectReason || 'Declined by society representative');
      setIsRejectModalOpen(false);
      setRejectReason('');
    }
  };

  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationNotes.trim()) return;
    if (activeQuote) {
      requestQuoteClarification(
        activeQuote.id,
        clarificationNotes + (attachmentFileName ? ` (Attached Ref: ${attachmentFileName})` : '')
      );
      setIsClarificationModalOpen(false);
      setClarificationNotes('');
      setAttachmentFileName('');
    }
  };

  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
            ✕ Rejected
          </span>
        );
      case 'clarification_requested':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
            ? Clarification Requested
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-blue-100 text-[#1976D2] border border-blue-200">
            ● Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800 animate-fade-in">
      {/* Quotations List Sidebar (1 Col) */}
      <div className="lg:col-span-1 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
            Quotations & Proposals ({allQuotations.length})
          </h3>
        </div>

        <div className="space-y-3">
          {allQuotations.map((q) => {
            const isSelected = q.id === activeQuote?.id;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuoteId(q.id)}
                className={`w-full p-4 rounded-3xl border text-left transition-all flex flex-col gap-2 shadow-xs ${
                  isSelected
                    ? 'bg-blue-50/70 border-[#1976D2] ring-2 ring-[#1976D2]/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#1976D2]">
                    {q.quoteNumber || q.quotationNumber}
                  </span>
                  {getStatusBadge(q.status)}
                </div>

                <div className="text-xs font-bold text-slate-900 truncate">{q.subject}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                  <span>{q.liftNumber}</span>
                  <span className="text-slate-900 font-bold">
                    ₹ {(q.grandTotal || q.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotation Detail & Approval Canvas (2 Cols) */}
      {activeQuote && (
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col gap-6">
          {/* Header & Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-[#1976D2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {activeQuote.quoteNumber || activeQuote.quotationNumber}
                </span>
                {getStatusBadge(activeQuote.status)}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{activeQuote.subject}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lift: <strong className="text-slate-800 font-semibold">{activeQuote.liftNumber}</strong> • {activeQuote.buildingName} • Valid Until: <strong className="text-slate-800">{activeQuote.validUntil}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                Grand Total (Incl. GST)
              </span>
              <span className="text-2xl font-black font-mono text-[#1976D2]">
                ₹ {(activeQuote.grandTotal || activeQuote.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase font-mono">Scope of Work & Materials</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F8FA] text-slate-700 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 font-bold">Item Description</th>
                    <th className="p-3.5 font-bold">HSN Code</th>
                    <th className="p-3.5 text-center font-bold">Qty</th>
                    <th className="p-3.5 text-right font-bold">Rate (₹)</th>
                    <th className="p-3.5 text-right font-bold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeQuote.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-sans font-medium text-slate-900">{item.description}</td>
                      <td className="p-3.5 text-slate-500">{item.hsnCode || '84313100'}</td>
                      <td className="p-3.5 text-center text-slate-700">{item.quantity}</td>
                      <td className="p-3.5 text-right text-slate-700">₹ {item.unitRate.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">₹ {item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Strip */}
          <div className="p-4 rounded-2xl bg-[#F5F8FA] border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="text-slate-600">
                Subtotal (Materials + Labor): <strong className="text-slate-900">₹ {activeQuote.subtotal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="text-slate-600">
                Applicable GST (18%): <strong className="text-slate-900">₹ {activeQuote.gstAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Net Payable Amount</span>
              <span className="text-xl font-black text-[#1976D2]">
                ₹ {(activeQuote.grandTotal || activeQuote.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-xs">Terms & Conditions:</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              {activeQuote.terms.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Clarification Notes if any */}
          {activeQuote.clarificationNotes && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Client Query / Clarification Logged:
              </span>
              <p className="text-amber-800">{activeQuote.clarificationNotes}</p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={() => downloadQuotationPdf(activeQuote, activeCompany)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-[#1976D2]" />
              <span>Download Quotation PDF</span>
            </button>

            {activeQuote.status !== 'approved' && activeQuote.status !== 'rejected' && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setIsClarificationModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Clarification</span>
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Authorize</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {isApproveModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Approve Quotation</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are authorizing Quotation {activeQuote.quoteNumber || activeQuote.quotationNumber} for ₹{' '}
                {(activeQuote.grandTotal || activeQuote.totalAmount || 0).toLocaleString('en-IN')}.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 text-left font-mono">
              <div>Equipment: <strong>{activeQuote.liftNumber}</strong></div>
              <div>Subject: {activeQuote.subject}</div>
              <div>Work Order will be generated automatically upon approval.</div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {isRejectModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Quotation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Please specify the reason for declining this estimate
            </p>

            <form onSubmit={handleRejectConfirm} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rejection Reason</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Price exceeds approved committee budget / Alternative OEM scope chosen..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                >
                  Decline Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Clarification Modal */}
      {isClarificationModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsClarificationModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>Request Clarification</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Ask technical questions, discuss warranty, or negotiate pricing with our service desk
            </p>

            <form onSubmit={handleClarificationSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clarification Message</label>
                <textarea
                  rows={3}
                  required
                  value={clarificationNotes}
                  onChange={(e) => setClarificationNotes(e.target.value)}
                  placeholder="e.g., Can you provide details on the manufacturer warranty period for the inverter drive?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Optional Attachment / Document</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="quote-attachment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAttachmentFileName(file.name);
                    }}
                  />
                  <label
                    htmlFor="quote-attachment"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold flex items-center gap-2 cursor-pointer truncate"
                  >
                    <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{attachmentFileName || 'Upload Supporting PDF / Photo'}</span>
                  </label>
                  {attachmentFileName && (
                    <button
                      type="button"
                      onClick={() => setAttachmentFileName('')}
                      className="p-2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClarificationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Query</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
