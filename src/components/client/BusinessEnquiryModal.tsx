import React, { useState } from 'react';
import { X, Sparkles, Building, Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BusinessEnquiry } from '../../types';

interface BusinessEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: BusinessEnquiry['enquiryType'];
}

export const BusinessEnquiryModal: React.FC<BusinessEnquiryModalProps> = ({
  isOpen,
  onClose,
  defaultType,
}) => {
  const { submitBusinessEnquiry, currentUser } = useApp();

  const [enquiryType, setEnquiryType] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pending = sessionStorage.getItem('wepsun_pending_quote_service');
      if (pending) return pending;
    }
    return defaultType || 'Lift Installation & Maintenance';
  });

  const [clientName, setClientName] = useState(() => currentUser?.name || '');
  const [phone, setPhone] = useState(() => currentUser?.phone || '');
  const [email, setEmail] = useState(() => currentUser?.email || '');
  const [societyOrBuilding, setSocietyOrBuilding] = useState('');
  const [numberOfLifts, setNumberOfLifts] = useState(1);
  const [numberOfFloors, setNumberOfFloors] = useState(10);
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        const pending = sessionStorage.getItem('wepsun_pending_quote_service');
        if (pending) {
          setEnquiryType(pending);
        }
      }
      if (currentUser) {
        if (!clientName && currentUser.name) setClientName(currentUser.name);
        if (!email && currentUser.email) setEmail(currentUser.email);
        if (!phone && currentUser.phone) setPhone(currentUser.phone);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBusinessEnquiry({
      enquiryType: enquiryType as any,
      clientName: clientName || currentUser?.name || 'Prospective Customer',
      phone: phone || currentUser?.phone || '+91 98200 00000',
      email: email || currentUser?.email || 'society@example.com',
      societyOrBuilding: societyOrBuilding || 'Commercial / Residential Site',
      numberOfLifts,
      numberOfFloors,
      message,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wepsun_pending_quote_service');
      sessionStorage.removeItem('wepsun_open_quote_after_login');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative text-slate-800 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 pb-2 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-[#123B5D] flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Elevator Engineering & Proposals
            </h3>
            <p className="text-xs text-slate-500">
              Direct consultation with WEPSUN senior elevator engineers
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Enquiry Service Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Turnkey Lift Installation',
                'Annual Maintenance Contract (AMC)',
                'Emergency Breakdown Service',
                'Lift Modernization & Refurbishment',
                'Annual Safety Audit & Compliance',
                'Spare Parts & Component Replacement',
              ].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setEnquiryType(t as any)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    enquiryType === t
                      ? 'bg-blue-50/80 border-[#1976D2] text-[#1976D2] font-bold ring-1 ring-[#1976D2]/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ● {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Contact Person Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Ramesh Kulkarni (Chairman)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none font-mono transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Building / Society / Project Name</label>
            <input
              type="text"
              required
              value={societyOrBuilding}
              onChange={(e) => setSocietyOrBuilding(e.target.value)}
              placeholder="e.g. SeaBreeze Residency, Palm Beach Road"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Number of Lifts</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numberOfLifts}
                onChange={(e) => setNumberOfLifts(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none font-mono transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Number of Floors</label>
              <input
                type="number"
                min={1}
                max={60}
                value={numberOfFloors}
                onChange={(e) => setNumberOfFloors(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none font-mono transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Specific Requirements</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Looking for high speed gearless MRL elevators with auto-rescue..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <Send className="w-4 h-4" />
            Submit Proposal Request
          </button>
        </form>
      </div>
    </div>
  );
};
