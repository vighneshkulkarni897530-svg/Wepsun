import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  Users,
  Smile,
  ChevronRight,
  Headphones,
  HardHat,
  Send,
  CheckCircle2,
  LogIn,
  Sparkles,
  Building,
  FileText,
  Play,
  Wrench,
  Cpu,
  Clock,
  Activity,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GeometricBlueWLogo } from './WepsunLogo';
import { LoginPage } from './LoginPage';
import loginHeroImg from '../../assets/login-hero.jpg';
import elevatorLobbyImg from '../../assets/elevator-lobby.jpg';
import elevatorGlassLobbyImg from '../../assets/elevator-glass-lobby.jpg';
import buildingGlassImg from '../../assets/building-glass.jpg';
import constructionPlansImg from '../../assets/construction-plans-sunset.jpg';

interface LandingPageProps {
  onClose?: () => void;
  defaultRole?: 'technician' | 'client';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onClose,
  defaultRole = 'client',
}) => {
  const { currentUser, submitBusinessEnquiry, showToast, currentRole } = useApp();

  // Navigation & Screen States
  const [authScreen, setAuthScreen] = useState<'signin' | 'signup' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactReferenceId, setContactReferenceId] = useState('');
  const [selectedServiceModal, setSelectedServiceModal] = useState<string | null>(null);

  // Contact / Quote form state
  const [contactName, setContactName] = useState(() => currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(() => currentUser?.phone || '');
  const [contactEmail, setContactEmail] = useState(() => currentUser?.email || '');
  const [contactBuilding, setContactBuilding] = useState('');
  const [contactService, setContactService] = useState('Lift Installation & Maintenance');
  const [contactMessage, setContactMessage] = useState('');

  // Service Quote Flow: If clicked, save pending service, sign in first, then open quote modal
  const handleServiceQuoteFlow = (serviceName: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('wepsun_pending_quote_service', serviceName);
      sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
    }
    setContactService(serviceName);
    setIsDrawerOpen(false);
    setSelectedServiceModal(null);

    if (currentUser) {
      setContactName(currentUser.name || '');
      setContactEmail(currentUser.email || '');
      setContactPhone(currentUser.phone || '');
      setIsContactModalOpen(true);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('wepsun_open_quote_after_login');
      }
    } else {
      setAuthScreen('signin');
    }
  };

  // Listen for login completion to auto-open quote modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldOpen = sessionStorage.getItem('wepsun_open_quote_after_login');
      const pending = sessionStorage.getItem('wepsun_pending_quote_service');
      if (shouldOpen === 'true') {
        if (pending) {
          setContactService(pending);
        }
        if (currentUser) {
          setContactName(currentUser.name || '');
          setContactEmail(currentUser.email || '');
          setContactPhone(currentUser.phone || '');
        }
        setIsContactModalOpen(true);
        sessionStorage.removeItem('wepsun_open_quote_after_login');
      }
    }
  }, [currentUser]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce compulsory login: guest users cannot submit quotation requests
    if (!currentUser) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('wepsun_pending_quote_service', contactService);
        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
      }
      setIsContactModalOpen(false);
      if (showToast) {
        showToast('info', 'Login Required', 'Please sign in or create an account first to submit your quotation request.');
      }
      setAuthScreen('signin');
      return;
    }

    const refId = 'QT-REQ-' + Math.floor(1000 + Math.random() * 9000);
    setContactReferenceId(refId);

    if (submitBusinessEnquiry) {
      submitBusinessEnquiry({
        enquiryType: contactService as any,
        clientName: contactName || currentUser.name || 'Valued Customer',
        phone: contactPhone || currentUser.phone || '+91 8595940077',
        email: contactEmail || currentUser.email || 'contact@domain.com',
        societyOrBuilding: contactBuilding || 'Site Project',
        message: contactMessage,
      });
    }

    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setIsContactModalOpen(false);
      setContactMessage('');
      setContactBuilding('');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('wepsun_pending_quote_service');
        sessionStorage.removeItem('wepsun_open_quote_after_login');
      }
    }, 2800);
  };

  // If user opened Sign In or Sign Up screen
  if (authScreen) {
    return (
      <LoginPage
        isOpen={true}
        initialView={authScreen}
        defaultRole={defaultRole}
        onClose={() => {
          setAuthScreen(null);
          const shouldOpen = typeof window !== 'undefined' ? sessionStorage.getItem('wepsun_open_quote_after_login') : null;
          const pending = typeof window !== 'undefined' ? sessionStorage.getItem('wepsun_pending_quote_service') : null;
          if (shouldOpen === 'true') {
            if (pending) {
              setContactService(pending);
            }
            if (currentUser) {
              setContactName(currentUser.name || '');
              setContactEmail(currentUser.email || '');
              setContactPhone(currentUser.phone || '');
            }
            setIsContactModalOpen(true);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('wepsun_open_quote_after_login');
            }
          } else {
            const savedRole = localStorage.getItem('wepsun_role') || currentRole || 'company_admin';
            const target = savedRole === 'client' ? 'home' : savedRole === 'technician' ? 'jobs' : 'dashboard';
            window.location.hash = target;
            if (onClose) onClose();
          }
        }}
        isModal={false}
      />
    );
  }

  // Lift Outline SVG Icon
  const LiftOutlineIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <polyline points="7 6 9 4 11 6" />
      <polyline points="13 6 15 4 17 6" />
    </svg>
  );

  if (authScreen) {
    return (
      <LoginPage
        isOpen={true}
        initialView={authScreen}
        defaultRole={defaultRole}
        onClose={() => {
          setAuthScreen(null);
          if (onClose) onClose();
        }}
        isModal={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#0066FF] selection:text-white flex flex-col justify-between">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR / HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-8 lg:px-12 py-3 sm:py-3.5 flex items-center justify-between transition-all">
        {/* Brand Lockup */}
        <div
          className="cursor-pointer flex items-center gap-2 sm:gap-3 select-none shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <GeometricBlueWLogo className="w-9 h-7.5 sm:w-12 sm:h-9 drop-shadow-sm shrink-0" />
          <div className="flex flex-col justify-center leading-none">
            <span className="font-sans font-black text-lg sm:text-2xl text-[#0b2545] tracking-tight leading-none">
              WEPSUN
            </span>
            <span className="font-sans font-bold text-[7.5px] sm:text-[10.5px] text-slate-700 tracking-[0.18em] sm:tracking-[0.22em] mt-0.5 sm:mt-1 leading-none">
              ENGINEERING SOLUTION
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
          <button
            onClick={() => {
              const el = document.getElementById('services-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#0066FF] transition-colors cursor-pointer"
          >
            Our Services
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('about-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#0066FF] transition-colors cursor-pointer"
          >
            About Us
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('why-us-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#0066FF] transition-colors cursor-pointer"
          >
            Why Choose Us
          </button>
          <button
            onClick={() => handleServiceQuoteFlow(contactService || 'Lift Installation & Maintenance')}
            className="hover:text-[#0066FF] transition-colors cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Right Navigation & Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sign In Button (Visible on all screens: Mobile & Desktop) */}
          <button
            type="button"
            onClick={() => setAuthScreen('signin')}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          {/* Quick Sign Up Button (Visible on all screens beside Sign In) */}
          <button
            type="button"
            onClick={() => setAuthScreen('signup')}
            className="inline-flex px-3 sm:px-4 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Sign Up
          </button>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Menu"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-[#0b2545]" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-gradient-to-br from-[#F0F9FF] via-[#F8FAFC] to-[#EFF6FF] overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 px-5 sm:px-8 lg:px-12 py-10 sm:py-16 z-10">
            {/* Small Blue Dash */}
            <div className="h-1 w-8 bg-[#0066FF] rounded-full mb-3" />

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.15] text-[#0b2545]">
              Smart Engineering.
              <br />
              <span className="text-[#0066FF]">Elevating Standards.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed mt-3.5 mb-7 max-w-lg">
              ISO 9001:2015 certified elevator OEM, turnkey passenger & freight lift installations, 24/7 breakdown dispatch, digital QR lift passports, and comprehensive AMC services.
            </p>

            {/* Hero CTA Row */}
            <div className="flex flex-wrap items-center gap-3.5">
              {/* Call Support Center Pill Box */}
              <div className="inline-flex items-center gap-3.5 bg-white border border-sky-200/90 rounded-2xl p-3 sm:p-4 shadow-sm shadow-sky-500/5 max-w-sm">
                <a
                  href="tel:+918595940077"
                  className="w-11 h-11 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 transition-transform hover:scale-105"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500 leading-none">
                    24/7 Breakdown Control Room
                  </span>
                  <a
                    href="tel:+918595940077"
                    className="text-base sm:text-lg font-black text-[#0b2545] hover:text-[#0066FF] transition-colors mt-1 leading-none tracking-tight"
                  >
                    +91 8595940077
                  </a>
                </div>
              </div>

              {/* Quick Sign In Hero CTA */}
              <button
                type="button"
                onClick={() => setAuthScreen('signin')}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0b2545] hover:bg-[#123866] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4 text-sky-400" />
                <span>Customer Portal</span>
              </button>
            </div>
          </div>

          {/* Right Image Column (Elevator Technician & Modern Lift Panel) */}
          <div className="lg:col-span-6 relative h-72 sm:h-96 lg:h-[480px] w-full overflow-hidden">
            <img
              src={loginHeroImg}
              alt="WEPSUN Engineering Solution Elevator Maintenance"
              className="w-full h-full object-cover object-center select-none"
              draggable={false}
            />
            {/* Subtle Gradient Blend to Left on Desktop */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F0F9FF] via-transparent to-transparent hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F0F9FF] via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ABOUT US SECTION */}
      {/* ========================================================================= */}
      <section id="about-section" className="bg-white py-10 sm:py-14 px-5 sm:px-8 lg:px-12 border-b border-slate-100 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7">
              {/* Blue Dash & Header */}
              <div className="flex items-center gap-2 text-[#0066FF] font-bold text-xs uppercase tracking-wider mb-2">
                <div className="h-0.5 w-6 bg-[#0066FF] rounded-full" />
                <span>About Us</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#0b2545] tracking-tight mb-3">
                WEPSUN ENGINEERING SOLUTION
              </h2>

              <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl">
                WEPSUN Engineering Solution is an ISO 9001:2015 certified elevator OEM and smart lift operations partner. We deliver precision lift installation, comprehensive AMC servicing, and intelligent modernization adhering strictly to IS 14665 and EN 81 safety standards.
              </p>
            </div>

            {/* Right Architectural Glass Elevator Image */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/90 h-56 sm:h-64 lg:h-72 relative group">
                <img
                  src={elevatorGlassLobbyImg}
                  alt="Modern Glass Elevator Lobby Architecture"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OUR SERVICES - WHAT WE OFFER SECTION */}
      {/* ========================================================================= */}
      <section id="services-section" className="bg-[#F8FAFC] py-10 sm:py-16 px-5 sm:px-8 lg:px-12 border-b border-slate-100 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#0066FF] font-bold text-xs uppercase tracking-wider mb-1.5">
                <div className="h-0.5 w-6 bg-[#0066FF] rounded-full" />
                <span>Our Core Service</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0b2545] tracking-tight">
                Lift Installation & Maintenance
              </h2>
            </div>
            <button
              onClick={() => setAuthScreen('signin')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] text-xs sm:text-sm font-bold transition-all cursor-pointer self-start sm:self-auto"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Manage Services</span>
            </button>
          </div>

          {/* Single Dedicated Elevator Showcase */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 grid grid-cols-1 lg:grid-cols-12 transition-all">
            {/* Left Info & Action Panel */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0066FF] text-xs font-bold mb-4 border border-blue-100">
                  <LiftOutlineIcon className="w-4 h-4" />
                  <span>ISO 9001:2015 & IS 14665 / EN 81 Compliant</span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0b2545] leading-tight">
                  Turnkey Lift Installation & Lifetime AMC Support
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                  Passenger, freight, stretcher, hydraulic, and capsule panoramic elevators engineered with 24/7 breakdown dispatch, digital QR inspection passports, and 100% genuine OEM spare parts.
                </p>

                {/* 4 Feature Deliverables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-[#0066FF] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0b2545]">OEM Lift Installation</h4>
                      <p className="text-[11px] text-slate-500">Custom cabins, gearless VVVF drives & structural shaft engineering.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0b2545]">Comprehensive AMC Plans</h4>
                      <p className="text-[11px] text-slate-500">Monthly preventive service, safety switch audits & QR logs.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0b2545]">24/7 Breakdown Dispatch</h4>
                      <p className="text-[11px] text-slate-500">Rapid response field technician dispatch in under 25 minutes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0b2545]">Modernization & Spares</h4>
                      <p className="text-[11px] text-slate-500">Auto Rescue Devices (ARD), controller upgrades & OEM spares.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleServiceQuoteFlow('Lift Installation & Maintenance')}
                  className="py-3.5 px-6 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Quote</span>
                </button>

                <a
                  href="tel:+918595940077"
                  className="py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 text-[#0b2545] font-bold text-xs sm:text-sm border border-slate-200 flex items-center gap-2 transition-all"
                >
                  <Phone className="w-4 h-4 text-[#0066FF]" />
                  <span>24/7 Hotline: +91 8595940077</span>
                </a>
              </div>
            </div>

            {/* Right Image Visual */}
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[440px] overflow-hidden">
              <img
                src={elevatorLobbyImg}
                alt="WEPSUN Lift Installation & Maintenance"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:to-slate-900/10" />

              {/* Floating Stat Pill on Image */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-white/95 backdrop-blur-md border border-white/60 p-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0b2545]">500+ Lifts Under AMC</div>
                  <div className="text-[10px] text-slate-500 font-medium">99.4% fleet uptime across Mumbai & Pune</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY CHOOSE US - YOUR TRUSTED ENGINEERING PARTNER */}
      {/* ========================================================================= */}
      <section id="why-us-section" className="bg-white py-10 sm:py-16 px-5 sm:px-8 lg:px-12 border-b border-slate-100 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[#0066FF] font-bold text-xs uppercase tracking-wider mb-1.5">
              <div className="h-0.5 w-6 bg-[#0066FF] rounded-full" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0b2545] tracking-tight">
              Your Trusted Elevator Engineering Partner
            </h2>
          </div>

          {/* 3 Circular Badges Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2 mb-10">
            {/* Badge 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E0F2FE] text-[#0066FF] flex items-center justify-center mb-3 shadow-sm">
                <Lightbulb className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                Smart IoT
                <br />
                Telemetry
              </h4>
            </div>

            {/* Badge 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E0F2FE] text-[#0066FF] flex items-center justify-center mb-3 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                IS 14665 & EN 81
                <br />
                Safety Standards
              </h4>
            </div>

            {/* Badge 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E0F2FE] text-[#0066FF] flex items-center justify-center mb-3 shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                24/7 Rapid
                <br />
                Field Dispatch
              </h4>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. KEY STATS / METRICS BAR - 100% LIFT FOCUSED */}
          {/* ========================================================================= */}
          <div className="bg-[#F0F9FF] border border-sky-200/80 rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {/* Stat 1 */}
            <div className="flex flex-col items-center md:border-r md:border-sky-200/80 md:pr-4">
              <LiftOutlineIcon className="w-6 h-6 text-[#0066FF] mb-1.5" />
              <div className="text-2xl sm:text-3xl font-black text-[#0066FF] tracking-tight">
                500+
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">
                Registered Lifts
                <br />
                Maintained
              </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center md:border-r md:border-sky-200/80 md:pr-4">
              <Clock className="w-6 h-6 text-[#0066FF] mb-1.5" />
              <div className="text-2xl sm:text-3xl font-black text-[#0066FF] tracking-tight">
                &lt; 25 Min
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">
                Emergency Breakdown
                <br />
                Response Time
              </p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center md:border-r md:border-sky-200/80 md:pr-4">
              <ShieldCheck className="w-6 h-6 text-[#0066FF] mb-1.5" />
              <div className="text-2xl sm:text-3xl font-black text-[#0066FF] tracking-tight">
                100%
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">
                Safety Audit
                <br />
                Compliance Rate
              </p>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center">
              <Activity className="w-6 h-6 text-[#0066FF] mb-1.5" />
              <div className="text-2xl sm:text-3xl font-black text-[#0066FF] tracking-tight">
                99.4%
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">
                Fleet Operational
                <br />
                Uptime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. "LET'S BUILD SOMETHING GREAT TOGETHER!" BANNER */}
      {/* ========================================================================= */}
      <section className="bg-white py-8 sm:py-12 px-5 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-sky-200/80 bg-gradient-to-r from-[#031527]/90 via-[#031527]/75 to-transparent min-h-[220px] flex items-center">
            {/* Background Architectural Glass Elevator Image */}
            <img
              src={buildingGlassImg}
              alt="Elevator Engineering & Smart Mobility"
              className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none"
              draggable={false}
            />
            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b2545]/95 via-[#0b2545]/80 to-[#0066FF]/20 z-10" />

            {/* Content */}
            <div className="relative z-20 p-6 sm:p-10 lg:p-12 max-w-xl text-white">
              {/* Dash */}
              <div className="h-1 w-8 bg-[#38BDF8] rounded-full mb-3" />

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Elevate Your Building's
                <br />
                Safety & Performance
              </h2>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => handleServiceQuoteFlow(contactService || 'Turnkey Lift Installation')}
                  className="px-6 sm:px-8 py-3 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Request an Elevator Proposal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CONTACT US SECTION */}
      {/* ========================================================================= */}
      <section className="bg-white pb-10 sm:pb-14 px-5 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#F0F9FF] border border-sky-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 text-[#0066FF] font-bold text-xs uppercase tracking-wider mb-4">
              <div className="h-0.5 w-6 bg-[#0066FF] rounded-full" />
              <span>Contact Us</span>
            </div>

            {/* 2-Column Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Phone & Email */}
              <div className="space-y-4">
                {/* Phone Numbers */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                    <a
                      href="tel:+918595940077"
                      className="block hover:text-[#0066FF] transition-colors"
                    >
                      +91 8595940077
                    </a>
                    <a
                      href="tel:+917011728010"
                      className="block hover:text-[#0066FF] transition-colors"
                    >
                      +91 7011728010
                    </a>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <a
                    href="mailto:wepsunengineering@gmail.com"
                    className="text-xs sm:text-sm font-bold text-slate-800 hover:text-[#0066FF] transition-colors break-all"
                  >
                    wepsunengineering@gmail.com
                  </a>
                </div>
              </div>

              {/* Right Column: Physical Address */}
              <div className="flex items-start gap-3.5 md:border-l md:border-sky-200/80 md:pl-8">
                <div className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900">Shop No. 29, Ashoka Enclave</p>
                  <p>Part-2, Sector 37,</p>
                  <p>Faridabad, Haryana 121003</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BOTTOM FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-5 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">WEPSUN Engineering Solution</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <button
              onClick={() => setAuthScreen('signin')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <span>•</span>
            <button
              onClick={() => setAuthScreen('signup')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Create Account
            </button>
            <span>•</span>
            <button
              onClick={() => handleServiceQuoteFlow(contactService || 'Lift Installation & Maintenance')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact Support
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SIDE DRAWER MENU (TRIGGERED BY HAMBURGER) */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <GeometricBlueWLogo className="w-9 h-7" />
                  <span className="font-black text-lg text-[#0b2545]">WEPSUN</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Links */}
              <div className="py-6 space-y-2">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setAuthScreen('signin');
                  }}
                  className="w-full text-left py-3 px-4 rounded-xl bg-blue-50 text-[#0066FF] font-bold text-sm flex items-center justify-between hover:bg-blue-100 transition-colors"
                >
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setAuthScreen('signup');
                  }}
                  className="w-full text-left py-3 px-4 rounded-xl bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="my-4 border-t border-slate-100 pt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">
                    Our Engineering Services
                  </p>

                  <button
                    onClick={() => handleServiceQuoteFlow('Lift Installation & Maintenance')}
                    className="w-full text-left py-2.5 px-4 text-xs font-semibold text-slate-700 hover:text-[#0066FF] hover:bg-blue-50/60 rounded-xl flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <LiftOutlineIcon className="w-4 h-4 text-[#0066FF]" />
                      <span>Lift Installation & Maintenance</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0066FF] transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Support */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                24x7 Direct Hotline
              </p>
              <a
                href="tel:+918595940077"
                className="flex items-center gap-2 text-sm font-bold text-[#0b2545] hover:text-[#0066FF]"
              >
                <Phone className="w-4 h-4 text-[#0066FF]" />
                <span>+91 8595940077</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTACT / QUOTE REQUEST MODAL */}
      {/* ========================================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <div className="flex items-center gap-2 text-[#0066FF] font-bold text-xs uppercase tracking-wider mb-1">
                <div className="h-0.5 w-6 bg-[#0066FF] rounded-full" />
                <span>Commercial Quotation</span>
              </div>
              <h3 className="text-2xl font-black text-[#0b2545] tracking-tight">
                Request a Custom Quote
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fill out the project specifications below and our engineering team will generate your commercial proposal.
              </p>

              {/* Logged In Status or Compulsory Login Notice Badge */}
              {currentUser ? (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-[#0066FF] flex items-center justify-between font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                    <span>
                      Signed In as <strong className="text-[#0b2545]">{currentUser.name}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 font-bold text-[#0066FF] uppercase">
                    {currentUser.role}
                  </span>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-amber-900">Sign In Required to Submit</div>
                    <p className="text-amber-700 text-[11px] mt-0.5">
                      You must be signed in to submit an official commercial quotation request.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('wepsun_pending_quote_service', contactService);
                        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
                      }
                      setIsContactModalOpen(false);
                      setAuthScreen('signin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-[11px] shrink-0 cursor-pointer transition-all shadow-xs"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {contactSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-black text-lg text-emerald-900">
                  Quotation Request Submitted!
                </h4>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                  Reference: {contactReferenceId || 'QT-REQ-8492'}
                </div>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you for submitting your requirements for <strong>{contactService}</strong>. A WEPSUN specialist will review your specs and contact you at {contactPhone || '+91 8595940077'}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF] bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF] bg-slate-50/50 focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF] bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Building / Society / Project Name
                  </label>
                  <input
                    type="text"
                    value={contactBuilding}
                    onChange={(e) => setContactBuilding(e.target.value)}
                    placeholder="e.g. SeaBreeze Residency, Commercial Plaza..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF] bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Engineering Vertical / Service
                  </label>
                  <select
                    value={contactService}
                    onChange={(e) => setContactService(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF] bg-white font-medium"
                  >
                    <option value="Turnkey Lift Installation">Turnkey Lift Installation</option>
                    <option value="Annual Maintenance Contract (AMC)">Annual Maintenance Contract (AMC)</option>
                    <option value="Emergency Breakdown Service">Emergency Breakdown Service (24/7)</option>
                    <option value="Lift Modernization & Controller Upgrade">Lift Modernization & Controller Upgrade</option>
                    <option value="OEM Spare Parts & Component Replacement">OEM Spare Parts & Component Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Scope / Specifications
                  </label>
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Provide details: capacity, floors, location, technical requirements..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF] bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>

                {currentUser ? (
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Quotation Request</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('wepsun_pending_quote_service', contactService);
                        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
                      }
                      setIsContactModalOpen(false);
                      if (showToast) {
                        showToast('info', 'Login Required', 'Please sign in first to submit your quotation request.');
                      }
                      setAuthScreen('signin');
                    }}
                    className="w-full py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Submit Quotation Request</span>
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SERVICE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedServiceModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedServiceModal === 'lift' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                    <LiftOutlineIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#0066FF] tracking-wider block">Engineering Vertical</span>
                    <h3 className="text-xl font-black text-[#0b2545]">Turnkey Lift Installation</h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Turnkey passenger elevators, hospital stretcher lifts, freight elevators, hydraulic lifts, and capsule panoramic elevators. Includes 24/7 breakdown support, OEM spares, preventive maintenance, and safety audit compliance.
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">Service Scope & Deliverables</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span>Turnkey OEM Lift Installation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span>24x7 Breakdown Dispatch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span>Digital Lift Passports (QR)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span>IS 14665 & EN 81 Compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedServiceModal === 'amc' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Engineering Vertical</span>
                    <h3 className="text-xl font-black text-[#0b2545]">Annual Maintenance (AMC)</h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Comprehensive & non-comprehensive elevator AMC contracts tailored for residential societies, IT parks, hospitals, and commercial buildings. Includes monthly preventive checkups, safety switch testing, and rapid breakdown response.
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">Service Scope & Deliverables</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Monthly Preventive Maintenance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>24/7 Breakdown Dispatch (&lt; 25 min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Digital QR Inspection Passports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Safety Audit & Licensing Compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedServiceModal === 'modernization' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider block">Engineering Vertical</span>
                    <h3 className="text-xl font-black text-[#0b2545]">Lift Modernization & OEM Spares</h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Transform aging elevators with energy-efficient VVVF microprocessor controllers, Automatic Rescue Devices (ARD), precision door operators, and genuine OEM spare parts for optimal ride smoothness.
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">Service Scope & Deliverables</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>VVVF Microprocessor Controllers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Automatic Rescue Device (ARD)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Cabin Cladding & Modern Aesthetics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>100% Genuine OEM Spares Warranty</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button: Single Request Quote */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const serviceName =
                    selectedServiceModal === 'amc'
                      ? 'Annual Maintenance Contract (AMC)'
                      : selectedServiceModal === 'modernization'
                      ? 'Lift Modernization & OEM Spares'
                      : 'Turnkey Lift Installation';
                  handleServiceQuoteFlow(serviceName);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Request Quote</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <a
                  href="tel:+918595940077"
                  className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Direct Hotline: +91 8595940077</span>
                </a>
                <span className="text-[11px] text-slate-400 font-medium">24x7 Support</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
