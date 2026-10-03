import React, { useState, useEffect } from 'react';
import {
  Star,
  HeartHandshake,
  CheckCircle2,
  ThumbsUp,
  ShieldCheck,
  Building,
  Layers,
  Wrench,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Phone,
  User,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WepsunLogo } from './WepsunLogo';

interface PublicFeedbackPageProps {
  onClose?: () => void;
  initialLiftNumber?: string;
  initialBuildingName?: string;
  initialTicketNumber?: string;
  initialTechName?: string;
}

export const PublicFeedbackPage: React.FC<PublicFeedbackPageProps> = ({
  onClose,
  initialLiftNumber,
  initialBuildingName,
  initialTicketNumber,
  initialTechName,
}) => {
  const { tenantLifts, tenantBuildings, tenantTechnicians, submitCustomerFeedback } = useApp();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [buildingName, setBuildingName] = useState(initialBuildingName || tenantBuildings[0]?.name || 'Greenwood Heights CHS');
  const [liftNumber, setLiftNumber] = useState(initialLiftNumber || tenantLifts[0]?.liftNumber || 'WPS-PUN-000123');
  const [technicianName, setTechnicianName] = useState(initialTechName || tenantTechnicians[0]?.name || 'Rajesh Sharma');
  const [ticketNumber, setTicketNumber] = useState(initialTicketNumber || '');
  const [serviceType, setServiceType] = useState<'Breakdown Resolution' | 'Routine PM Visit' | 'Annual Safety Inspection' | 'Parts Replacement' | 'Modernization'>('Breakdown Resolution');

  const [overallRating, setOverallRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [skillRating, setSkillRating] = useState<number>(5);
  const [rideRating, setRideRating] = useState<number>(5);
  const [commRating, setCommRating] = useState<number>(5);

  const [selectedTags, setSelectedTags] = useState<string[]>(['Prompt Arrival', 'Smooth Ride', 'Polite Technician']);
  const [comments, setComments] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState('');

  // Parse URL search params if present in hash or search query
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]) : null;

      const liftParam = hashParams?.get('lift') || urlParams.get('lift');
      const bldParam = hashParams?.get('building') || urlParams.get('building');
      const techParam = hashParams?.get('tech') || urlParams.get('tech');
      const ticketParam = hashParams?.get('ticket') || urlParams.get('ticket');

      if (liftParam) setLiftNumber(liftParam);
      if (bldParam) setBuildingName(bldParam);
      if (techParam) setTechnicianName(techParam);
      if (ticketParam) setTicketNumber(ticketParam);
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, []);

  const availableTags = [
    'Prompt Arrival',
    'Smooth Ride',
    'Polite Technician',
    'Clean Worksite',
    'Fixed on First Visit',
    'Detailed Explanation',
    'Safety Tested',
    'Excellent Communication',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return '⭐⭐⭐⭐⭐ Outstanding Excellence!';
      case 4: return '⭐⭐⭐⭐ Very Good Service';
      case 3: return '⭐⭐⭐ Satisfactory';
      case 2: return '⭐⭐ Needs Improvement';
      default: return '⭐ Poor Service';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const created = submitCustomerFeedback({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      buildingName,
      liftNumber,
      technicianName,
      ticketNumber: ticketNumber || undefined,
      serviceType,
      overallRating,
      ratingsBreakdown: {
        punctuality: punctualityRating,
        technicalSkill: skillRating,
        rideSmoothness: rideRating,
        communication: commRating,
      },
      tags: selectedTags,
      comments: comments.trim() || `Customer rated ${overallRating} stars for lift ${liftNumber} at ${buildingName}.`,
    });

    setSubmittedFeedbackId(created.id);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#123B5D] to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header Bar */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
            W
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wider block">WEPSUN</span>
            <span className="text-[10px] text-blue-300 font-semibold tracking-widest uppercase block">
              Engineering Solutions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Feedback Portal
          </span>
        </div>
      </div>

      {/* Main Feedback Form Card */}
      <div className="max-w-2xl w-full mx-auto my-6">
        {!isSubmitted ? (
          <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Rate Your Lift Service Experience
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Your direct rating helps our engineering team maintain zero-breakdown reliability and top-tier safety.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Overall Star Rating Box */}
              <div className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-5 text-center space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Overall Satisfaction Score
                </span>
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setOverallRating(star)}
                      className="p-1 sm:p-2 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-9 h-9 sm:w-11 sm:h-11 ${
                          star <= overallRating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-slate-200 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-sm font-extrabold text-amber-700">
                  {getRatingLabel(overallRating)}
                </div>
              </div>

              {/* Service Criteria Breakdown (4 dimensions) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Quality Dimensions:
                </span>

                {/* 1. Punctuality */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">⏱️ Arrival Speed & Punctuality:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPunctualityRating(s)}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${s <= punctualityRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Technical Skill */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">🔧 Technical Skill & Resolution:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSkillRating(s)}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${s <= skillRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Ride Smoothness */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">🛗 Lift Ride Smoothness & Leveling:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRideRating(s)}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${s <= rideRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Communication */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">🤝 Engineer Courtesy & Behavior:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setCommRating(s)}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${s <= commRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Tags */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Service Highlights:</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#1976D2] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700">Your Name / Designation *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni (Chairman)"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Mobile Phone (Optional)</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              {/* Building & Lift Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Building / Society Name</label>
                  <input
                    type="text"
                    required
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Lift Number</label>
                  <input
                    type="text"
                    required
                    value={liftNumber}
                    onChange={(e) => setLiftNumber(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Detailed Comments */}
              <div>
                <label className="font-bold text-slate-700">Detailed Feedback Remarks</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share details about elevator smoothness, speed of repair, or engineer professionalism..."
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#1976D2] hover:from-[#0e2f4a] hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Feedback & Rating</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white text-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Thank You for Your Feedback!</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Your {overallRating}-star review for <strong>{liftNumber} ({buildingName})</strong> has been recorded and published to our quality assurance dashboard.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-xs space-y-1 text-slate-700 font-mono text-left">
              <div>Review ID: <strong>{submittedFeedbackId}</strong></div>
              <div>Lift: <strong>{liftNumber}</strong></div>
              <div>Rating: <strong className="text-amber-500">{overallRating} / 5.0 Stars ★</strong></div>
              <div>Status: <span className="text-emerald-600 font-bold">Synchronized in Live Portal</span></div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  window.location.hash = 'feedback';
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>View on Feedback Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setComments('');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
              >
                Submit Another Rating
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="max-w-2xl w-full mx-auto text-center text-slate-400 text-xs pt-4 border-t border-white/10">
        <span>© {new Date().getFullYear()} WEPSUN Engineering Solutions • 24x7 Lift Emergency & Quality Assurance</span>
      </div>
    </div>
  );
};
