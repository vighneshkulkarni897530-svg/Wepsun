import React, { useState } from 'react';
import {
  Star,
  HeartHandshake,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Reply,
  Send,
  Building,
  Layers,
  Wrench,
  Clock,
  User,
  ShieldCheck,
  Award,
  Phone,
  Calendar,
  X,
  Plus,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Check,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerFeedback } from '../../types';

export const CustomerFeedbackManager: React.FC = () => {
  const {
    tenantFeedbacks,
    tenantTechnicians,
    tenantLifts,
    tenantBuildings,
    submitCustomerFeedback,
    replyToCustomerFeedback,
    updateFeedbackStatus,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all_reviews' | 'tech_leaderboard' | 'action_queue' | 'building_matrix'>('all_reviews');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Share Feedback Link Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareBuildingName, setShareBuildingName] = useState('');
  const [shareLiftNumber, setShareLiftNumber] = useState('');
  const [shareTechName, setShareTechName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Reply Modal State
  const [replyModalFeedback, setReplyModalFeedback] = useState<CustomerFeedback | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Add Feedback Modal State (for admin/service desk logging phone feedback)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newBuildingName, setNewBuildingName] = useState(tenantBuildings[0]?.name || 'Skyline Towers');
  const [newLiftNumber, setNewLiftNumber] = useState(tenantLifts[0]?.liftNumber || 'WPS-PUN-000123');
  const [newTechnicianName, setNewTechnicianName] = useState(tenantTechnicians[0]?.name || 'Rajesh Sharma');
  const [newRating, setNewRating] = useState(5);
  const [newServiceType, setNewServiceType] = useState<CustomerFeedback['serviceType']>('Breakdown Resolution');
  const [newComments, setNewComments] = useState('');
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [skillRating, setSkillRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [rideRating, setRideRating] = useState(5);

  const getFeedbackLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    let base = `${origin}${pathname}#feedback-form`;
    const params = new URLSearchParams();
    if (shareLiftNumber) params.append('lift', shareLiftNumber);
    if (shareBuildingName) params.append('building', shareBuildingName);
    if (shareTechName) params.append('tech', shareTechName);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const handleCopyLink = () => {
    const link = getFeedbackLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('success', 'Link Copied', 'Feedback link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filtered Feedbacks
  const filteredFeedbacks = tenantFeedbacks.filter((fb) => {
    if (selectedStarFilter !== 'all' && fb.overallRating !== selectedStarFilter) return false;
    if (selectedServiceType !== 'all' && fb.serviceType !== selectedServiceType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClient = fb.clientName?.toLowerCase().includes(q);
      const matchBuilding = fb.buildingName?.toLowerCase().includes(q);
      const matchLift = fb.liftNumber?.toLowerCase().includes(q);
      const matchTech = fb.technicianName?.toLowerCase().includes(q);
      const matchComments = fb.comments?.toLowerCase().includes(q);
      const matchTicket = fb.ticketNumber?.toLowerCase().includes(q);
      if (!matchClient && !matchBuilding && !matchLift && !matchTech && !matchComments && !matchTicket) return false;
    }
    return true;
  });

  // Action Queue (1-2 star reviews or under review)
  const actionQueueFeedbacks = tenantFeedbacks.filter(
    (fb) => fb.overallRating <= 2 || fb.status === 'under_review'
  );

  // Compute Metrics
  const totalReviews = tenantFeedbacks.length;
  const avgRating = totalReviews > 0
    ? (tenantFeedbacks.reduce((acc, fb) => acc + fb.overallRating, 0) / totalReviews).toFixed(1)
    : '5.0';
  
  const fiveStarCount = tenantFeedbacks.filter((fb) => fb.overallRating === 5).length;
  const fourStarCount = tenantFeedbacks.filter((fb) => fb.overallRating === 4).length;
  const threeStarCount = tenantFeedbacks.filter((fb) => fb.overallRating === 3).length;
  const lowStarCount = tenantFeedbacks.filter((fb) => fb.overallRating <= 2).length;

  // Handle Reply Submit
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalFeedback || !replyMessage.trim()) return;
    replyToCustomerFeedback(replyModalFeedback.id, replyMessage.trim());
    setReplyModalFeedback(null);
    setReplyMessage('');
  };

  // Handle Add Feedback Submit
  const handleCreateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newComments.trim()) return;
    
    submitCustomerFeedback({
      clientName: newClientName,
      buildingName: newBuildingName,
      liftNumber: newLiftNumber,
      technicianName: newTechnicianName,
      overallRating: newRating,
      ratingsBreakdown: {
        punctuality: punctualityRating,
        technicalSkill: skillRating,
        communication: communicationRating,
        rideSmoothness: rideRating,
      },
      serviceType: newServiceType,
      comments: newComments,
      tags: newRating >= 4 ? ['Prompt Service', 'Satisfied Client'] : ['Needs Attention'],
    });

    setIsAddModalOpen(false);
    setNewClientName('');
    setNewComments('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Feedback & Quality Ratings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {avgRating} CSAT Index
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time client satisfaction scoring, technician leaderboards, multi-zone service feedback, and SLA complaint follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-[#1976D2] font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Feedback Link</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Client Review</span>
          </button>
        </div>
      </div>

      {/* Top CSAT & NPS KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall CSAT Score */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall CSAT Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">{avgRating}</span>
                <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                <span className="text-xs font-semibold text-emerald-600 ml-1">↑ 0.2 this mo</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(Number(avgRating))
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
            <span className="text-[11px] font-medium text-slate-500 ml-2">Based on {totalReviews} reviews</span>
          </div>
        </div>

        {/* Card 2: Net Promoter Score (NPS) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Promoter Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">+84</span>
                <span className="text-xs font-semibold text-emerald-600">World Class</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>92% Promoters</span>
            <span>6% Passives</span>
            <span className="text-rose-600 font-semibold">2% Detractors</span>
          </div>
        </div>

        {/* Card 3: Quality Dimensions Score */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Quality Index</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">96.8%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Technician Punctuality</span>
              <span className="font-bold text-slate-800">4.9 ★</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ride Smoothness & Safety</span>
              <span className="font-bold text-slate-800">4.8 ★</span>
            </div>
          </div>
        </div>

        {/* Card 4: Action Attention Required */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Needs Follow-Up</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-rose-600">{lowStarCount}</span>
                <span className="text-xs font-medium text-slate-500">Low Rating Cases</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">100% Callback Target</span>
            <button
              onClick={() => setActiveTab('action_queue')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
            >
              View Queue →
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('all_reviews')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'all_reviews'
              ? 'border-[#1976D2] text-[#1976D2] bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>All Customer Reviews ({tenantFeedbacks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tech_leaderboard')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'tech_leaderboard'
              ? 'border-[#1976D2] text-[#1976D2] bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Technician Rating Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('action_queue')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'action_queue'
              ? 'border-[#1976D2] text-[#1976D2] bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Low-Rating Action Queue</span>
          {actionQueueFeedbacks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              {actionQueueFeedbacks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('building_matrix')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'building_matrix'
              ? 'border-[#1976D2] text-[#1976D2] bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Building & Lift CSAT Matrix</span>
        </button>
      </div>

      {/* Tab 1: All Customer Reviews */}
      {activeTab === 'all_reviews' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Stars:
              </span>
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 5, label: '5 ★ Stars' },
                { id: 4, label: '4 ★ Stars' },
                { id: 3, label: '3 ★ Stars' },
                { id: 2, label: '1-2 ★ (Action)' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedStarFilter(btn.id as number | 'all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedStarFilter === btn.id
                      ? 'bg-[#123B5D] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client, lift, comments..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
              >
                <option value="all">All Service Types</option>
                <option value="Breakdown Resolution">Breakdown Resolution</option>
                <option value="Routine PM Visit">Routine PM Visit</option>
                <option value="Annual Safety Inspection">Annual Safety Inspection</option>
                <option value="Parts Replacement">Parts Replacement</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3.5">
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
                <Smile className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No feedback records found matching current filters.</p>
              </div>
            ) : (
              filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all space-y-3"
                >
                  {/* Review Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                        {fb.clientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{fb.clientName}</span>
                          <span className="text-[11px] text-slate-400">• {fb.buildingName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-[#1976D2] border border-blue-200">
                            Lift {fb.liftNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{fb.serviceType}</span>
                          {fb.ticketNumber && <span>• Ticket #{fb.ticketNumber}</span>}
                          <span>• {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= fb.overallRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-extrabold text-amber-700 ml-1">
                          {fb.overallRating}.0
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Dimension Chips */}
                  {fb.ratingsBreakdown && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        ⏱️ Punctuality: <strong className="text-slate-900">{fb.ratingsBreakdown.punctuality}★</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        🔧 Technical Skill: <strong className="text-slate-900">{fb.ratingsBreakdown.technicalSkill}★</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        🤝 Communication: <strong className="text-slate-900">{fb.ratingsBreakdown.communication}★</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        🛗 Ride Smoothness: <strong className="text-slate-900">{fb.ratingsBreakdown.rideSmoothness}★</strong>
                      </span>
                    </div>
                  )}

                  {/* Customer Comments */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    "{fb.comments}"
                  </p>

                  {/* Tags and Attending Tech */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {fb.technicianName && (
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mr-2">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          Serviced by: <strong className="text-slate-900">{fb.technicianName}</strong>
                        </span>
                      )}

                      {fb.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {!fb.adminReply && (
                        <button
                          onClick={() => {
                            setReplyModalFeedback(fb);
                            setReplyMessage('');
                          }}
                          className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1976D2] text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply to Client</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Admin Reply Card (if present) */}
                  {fb.adminReply && (
                    <div className="mt-2 bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[#123B5D]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Response from {fb.adminReply.repliedBy}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(fb.adminReply.repliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs pl-5">
                        {fb.adminReply.message}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Technician Leaderboard */}
      {activeTab === 'tech_leaderboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Field Service Engineer Rating Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Performance rankings evaluated directly by building society chairmen, facility heads, and residents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {tenantTechnicians.map((tech, idx) => (
              <div
                key={tech.id}
                className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                {idx === 0 && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-600" /> Rank #1 Top Rated
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <img
                    src={tech.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'}
                    alt={tech.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{tech.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono block">{tech.employeeCode} • {tech.zone.split('(')[0]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Rating</span>
                    <span className="text-base font-extrabold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {tech.customerRating || 4.8} ★
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rated Jobs</span>
                    <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                      {tech.totalRatingsCount || 85} Reviews
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Avg Resolution Time:</span>
                    <strong className="text-slate-800">{tech.avgResolutionMinutes} mins</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Repeat Complaint Rate:</span>
                    <strong className="text-emerald-600 font-bold">{tech.repeatComplaintRatePct}% (Low)</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Low-Rating Action Queue */}
      {activeTab === 'action_queue' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Dissatisfied Client Resolution Queue</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Critical SLA: All 1-star and 2-star reviews mandate a service manager callback within 2 hours.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {actionQueueFeedbacks.length === 0 ? (
              <div className="p-8 text-center text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <h4 className="font-bold text-sm">All Clear! No pending dissatisfied client cases.</h4>
                <p className="text-xs text-emerald-700 mt-1">100% of customer reviews have been addressed.</p>
              </div>
            ) : (
              actionQueueFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="border border-rose-200 bg-rose-50/40 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{fb.clientName}</span>
                        <span className="text-xs text-slate-500">• {fb.buildingName} (Lift {fb.liftNumber})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          {fb.overallRating} ★ Critical Rating
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">"{fb.comments}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${fb.clientPhone || '+919820000000'}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Client</span>
                      </a>
                      <button
                        onClick={() => {
                          setReplyModalFeedback(fb);
                          setReplyMessage('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Log Action Taken</span>
                      </button>
                    </div>
                  </div>

                  {fb.adminReply && (
                    <div className="bg-white border border-rose-200 rounded-xl p-3 text-xs text-slate-700">
                      <strong>Resolution Note:</strong> {fb.adminReply.message} (by {fb.adminReply.repliedBy})
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Building & Lift CSAT Matrix */}
      {activeTab === 'building_matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Building-Wise Satisfaction & Health Scores</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated resident reviews by society and commercial complexes to isolate problematic elevator equipment.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 pr-4">Building Name</th>
                  <th className="py-3 px-4">Total Lifts</th>
                  <th className="py-3 px-4">Avg CSAT Rating</th>
                  <th className="py-3 px-4">Breakdown Complaints</th>
                  <th className="py-3 px-4">Customer Sentiment</th>
                  <th className="py-3 pl-4">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {[
                  { name: 'Skyline Towers', lifts: 4, rating: 4.9, breakdowns: 1, sentiment: 'Highly Satisfied', status: 'Optimal' },
                  { name: 'Greenwood Heights CHS', lifts: 2, rating: 4.8, breakdowns: 2, sentiment: 'Satisfied', status: 'Optimal' },
                  { name: 'Royal Residency', lifts: 3, rating: 4.9, breakdowns: 1, sentiment: 'Highly Satisfied', status: 'Optimal' },
                  { name: 'Sunrise Apartments', lifts: 2, rating: 4.7, breakdowns: 2, sentiment: 'Satisfied', status: 'Good' },
                  { name: 'Green Valley', lifts: 2, rating: 3.8, breakdowns: 4, sentiment: 'Observation Needed', status: 'Attention Required' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-900">{row.name}</td>
                    <td className="py-3 px-4 text-slate-600">{row.lifts} Units</td>
                    <td className="py-3 px-4 font-bold text-amber-600">{row.rating} ★</td>
                    <td className="py-3 px-4 text-slate-600">{row.breakdowns} this month</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        {row.sentiment}
                      </span>
                    </td>
                    <td className="py-3 pl-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.status === 'Optimal'
                            ? 'bg-emerald-100 text-emerald-700'
                            : row.status === 'Good'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalFeedback && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Reply to Customer Review</h3>
              <button onClick={() => setReplyModalFeedback(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">{replyModalFeedback.clientName} ({replyModalFeedback.buildingName})</div>
              <div className="text-amber-500 font-bold">{replyModalFeedback.overallRating} ★ Stars</div>
              <p className="italic text-slate-600">"{replyModalFeedback.comments}"</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Your Official Response / Action Note</label>
                <textarea
                  rows={4}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Thank the customer or explain what corrective action was taken by WEPSUN..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModalFeedback(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Client Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Client Feedback & Rating</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeedback} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Client / Secretary Name</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni (Chairman)"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Building / Society</label>
                  <input
                    type="text"
                    required
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Lift Number</label>
                  <input
                    type="text"
                    required
                    value={newLiftNumber}
                    onChange={(e) => setNewLiftNumber(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Service Engineer</label>
                  <input
                    type="text"
                    required
                    value={newTechnicianName}
                    onChange={(e) => setNewTechnicianName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Service Category</label>
                  <select
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value as any)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none"
                  >
                    <option value="Breakdown Resolution">Breakdown Resolution</option>
                    <option value="Routine PM Visit">Routine PM Visit</option>
                    <option value="Annual Safety Inspection">Annual Safety Inspection</option>
                    <option value="Parts Replacement">Parts Replacement</option>
                  </select>
                </div>
              </div>

              {/* Overall Star Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Overall Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= newRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-sm text-slate-800 ml-2">{newRating} of 5 Stars</span>
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="font-bold text-slate-700">Customer Feedback Comments</label>
                <textarea
                  rows={3}
                  required
                  value={newComments}
                  onChange={(e) => setNewComments(e.target.value)}
                  placeholder="Record customer remarks regarding lift operation, technician response, or quality..."
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1976D2] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold shadow-md shadow-blue-950/30"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share / Copy Feedback Link Generator Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1976D2] flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Customer Feedback Link</h3>
                  <p className="text-xs text-slate-500">Share with clients via WhatsApp, SMS, or QR code</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optional Pre-fill Parameters */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                Targeted Parameters (Optional):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Building</label>
                  <select
                    value={shareBuildingName}
                    onChange={(e) => setShareBuildingName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="">Any / General</option>
                    {tenantBuildings.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Lift No</label>
                  <select
                    value={shareLiftNumber}
                    onChange={(e) => setShareLiftNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none font-mono"
                  >
                    <option value="">Any / General</option>
                    {tenantLifts.map((l) => (
                      <option key={l.id} value={l.liftNumber}>{l.liftNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Engineer</label>
                  <select
                    value={shareTechName}
                    onChange={(e) => setShareTechName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="">Any / General</option>
                    {tenantTechnicians.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live URL Output Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Generated Shareable Link</label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono text-[11px] text-slate-800 break-all select-all">
                <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 truncate">{getFeedbackLink()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-[#1976D2] hover:bg-blue-700 text-white shadow-sm shadow-blue-600/30'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Dear Customer, please take a moment to rate your elevator service experience with WEPSUN: ${getFeedbackLink()}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all text-center"
              >
                <span>WhatsApp</span>
              </a>

              <a
                href={getFeedbackLink()}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all text-center"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Open Form</span>
              </a>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Instant Quality Sync:</strong> Any review submitted through this link immediately updates the CSAT metrics, review logs, and low-rating queue in this portal.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
