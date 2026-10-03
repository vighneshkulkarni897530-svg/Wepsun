import React, { useState } from 'react';
import { X, Star, HeartHandshake, CheckCircle2, ThumbsUp, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ClientFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string;
  liftNumber?: string;
  buildingName?: string;
  technicianName?: string;
}

export const ClientFeedbackModal: React.FC<ClientFeedbackModalProps> = ({
  isOpen,
  onClose,
  ticketId = 'CMP-2026-0416',
  liftNumber = 'WPS-PUN-000123',
  buildingName = 'Greenwood Heights CHS',
  technicianName = 'Rajesh Sharma',
}) => {
  const { submitCustomerFeedback, currentUser } = useApp();
  
  const [overallRating, setOverallRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [skillRating, setSkillRating] = useState<number>(5);
  const [rideRating, setRideRating] = useState<number>(5);
  const [commRating, setCommRating] = useState<number>(5);
  
  const [selectedTags, setSelectedTags] = useState<string[]>(['Prompt Arrival', 'Smooth Ride', 'Polite Technician']);
  const [comments, setComments] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

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
    
    submitCustomerFeedback({
      ticketNumber: ticketId,
      liftNumber,
      buildingName,
      technicianName,
      clientName: currentUser.name || 'Valued Society Member',
      clientPhone: currentUser.phone,
      overallRating,
      ratingsBreakdown: {
        punctuality: punctualityRating,
        technicalSkill: skillRating,
        rideSmoothness: rideRating,
        communication: commRating,
      },
      serviceType: 'Breakdown Resolution',
      tags: selectedTags,
      comments: comments || `Service completed satisfactorily for ${liftNumber} at ${buildingName}.`,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Rate Your Lift Service</h2>
          <p className="text-xs text-slate-500">
            Help WEPSUN maintain the highest safety and ride quality standards.
          </p>
          <div className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-50 text-[#1976D2] font-mono text-xs font-bold border border-blue-200">
            {ticketId ? `Ticket: #${ticketId} • ` : ''}Lift: {liftNumber} ({buildingName})
          </div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
            {/* Overall Star Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1.5">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Overall Service Rating</span>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= overallRating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600 block">
                {getRatingLabel(overallRating)}
              </span>
            </div>

            {/* Quality Dimensions Breakdown (4 criteria) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <span className="font-bold text-slate-800 block text-xs">Quality Breakdown:</span>
              
              {/* Punctuality */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">⏱️ Arrival Speed & Punctuality:</span>
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

              {/* Technical Skill */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">🔧 Technical Skill & Fix Quality:</span>
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

              {/* Ride Smoothness */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">🛗 Lift Ride Smoothness & Leveling:</span>
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

              {/* Communication */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">🤝 Technician Behavior & Courtesy:</span>
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

            {/* Tags Selection */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 block">Quick Highlights:</span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
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

            {/* Comment Box */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Detailed Feedback / Comments (Optional)</label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your remarks regarding elevator performance, sound levels, or engineer response..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold shadow-md shadow-blue-900/20 transition-all text-xs flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Submit Rating & Review</span>
            </button>
          </form>
        ) : (
          <div className="py-8 space-y-2 text-center text-emerald-700 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <h3 className="text-base font-bold">Review Recorded Successfully!</h3>
            <p className="text-xs text-slate-500">
              Thank you for helping us maintain excellent elevator operations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
