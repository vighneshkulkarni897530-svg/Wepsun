import React, { useState } from 'react';
import {
  Building2,
  GitBranch,
  Building,
  Users,
  Layers,
  ShieldCheck,
  UserCog,
  Wrench,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Database,
  Globe2,
  PhoneCall,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Download,
  Share2,
  Cpu,
  Layers3,
  Server,
  KeyRound,
  FileCheck2,
  Bell,
  Clock,
  ExternalLink,
  ZoomIn,
  Eye,
} from 'lucide-react';
import { WepsunLogo } from '../common/WepsunLogo';
import flowchartImage from '../../assets/wepsun-flowchart.jpg';

export const SystemFlowchartViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'interactive'>('blueprint');
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<string>('super_admin');
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);

  const userRoles = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      color: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-600',
      icon: <Globe2 className="w-5 h-5" />,
      features: ['All Companies Access', 'Full Tenant Isolation', 'System Settings & Global KPIs', 'Billing & Plans'],
    },
    {
      id: 'company_admin',
      name: 'Company Admin',
      color: 'from-purple-600 to-indigo-800',
      badgeBg: 'bg-purple-600',
      icon: <ShieldCheck className="w-5 h-5" />,
      features: ['Branches Management', 'Buildings & Client Setup', 'User & Staff Roles', 'Master Reports & Logs'],
    },
    {
      id: 'service_manager',
      name: 'Service Manager',
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-600',
      icon: <UserCog className="w-5 h-5" />,
      features: ['Complaints Triage', 'Job & Dispatch Allocation', 'Technician Radar', 'PM & AMC Scheduling'],
    },
    {
      id: 'technician',
      name: 'Technician',
      color: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-600',
      icon: <Wrench className="w-5 h-5" />,
      features: ['Assigned Jobs View', 'Step-by-Step PM Checklist', 'Spare Parts Consumption', 'Digital Signatures & PDF Reports'],
    },
    {
      id: 'accounts',
      name: 'Accounts',
      color: 'from-rose-600 to-pink-700',
      badgeBg: 'bg-rose-600',
      icon: <Receipt className="w-5 h-5" />,
      features: ['GST Invoices Generation', 'Razorpay & UPI Payments', 'Aging & Due Invoices', 'Financial Balance Sheets'],
    },
    {
      id: 'sales',
      name: 'Sales',
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-600',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      features: ['Item-wise Quotations', 'AMC Proposals', 'New Lead Inquiries', 'Quotation Follow-ups'],
    },
    {
      id: 'client',
      name: 'Client',
      color: 'from-cyan-600 to-teal-700',
      badgeBg: 'bg-cyan-600',
      icon: <Users className="w-5 h-5" />,
      features: ['Registered Lifts Fleet', 'Raise SOS Complaints', 'AMC Coverage Status', 'Online Invoices & History'],
    },
  ];

  const workflowStages = [
    {
      id: 1,
      title: '1. Client Portal',
      badge: 'Client',
      color: 'border-blue-500 bg-blue-50 text-blue-700',
      steps: [
        'Login / Mobile Dashboard',
        'View Registered Lifts & Equipment Specifications',
        'Raise Complaint or 24/7 Emergency SOS',
        'Live Real-time Status Tracker',
        'Review Service History, AMC & Quotations',
        'Make Online Payment (UPI / Razorpay)',
      ],
    },
    {
      id: 2,
      title: '2. Complaint Management',
      badge: 'Helpdesk',
      color: 'border-rose-500 bg-rose-50 text-rose-700',
      steps: [
        'Create Complaint (Unique ID + Priority Matrix)',
        'Auto Notification (SMS / WhatsApp / FCM) to Admin',
        'Intelligent Dispatch & Assign to Nearest Field Tech',
        'Status Lifecycle: Pending → Assigned → On Way → Inspection → Resolved → Closed',
        'Generate Service Report & Update Lift History',
      ],
    },
    {
      id: 3,
      title: '3. Technician Field Workflow',
      badge: 'Engineer App',
      color: 'border-teal-500 bg-teal-50 text-teal-700',
      steps: [
        'View Assigned Jobs (Details + Past History)',
        'Navigate to Site (Google Maps GPS Check-in)',
        'Start Job (Time-tracked Check-in timestamp)',
        'Digital PM Checklist & Fault Inspection',
        'Record Findings & Issue Spare Parts Used',
        'Upload Proof Photos / Audio-Video Notes',
        'Client Digital Signature + OTP Validation',
        'Complete Job (Auto Generate PDF Service Report)',
      ],
    },
    {
      id: 4,
      title: '4. Quotation & Work Order',
      badge: 'Sales & Ops',
      color: 'border-purple-500 bg-purple-50 text-purple-700',
      steps: [
        'Create Quotation (Itemized Parts + Labor + GST)',
        'Client Digital Approval / Rejection / Query',
        'Instant Conversion to Active Work Order (if approved)',
        'Assign Field Engineers & Allocate Inventory',
        'Track Execution Progress & Job Completion',
      ],
    },
    {
      id: 5,
      title: '5. AMC Management',
      badge: 'Contracts',
      color: 'border-amber-500 bg-amber-50 text-amber-700',
      steps: [
        'Create AMC Contract (Comprehensive / Non-Comprehensive)',
        'Configure PM Frequency (Monthly / Bi-Monthly / Quarterly)',
        'Track Contract Validity & Payment Milestones',
        'Automated Expiry Reminders (90 / 60 / 30 / 7 Days)',
        'Auto-Schedule Preventive Maintenance Visits',
        'Annual Contract Renewal & Revision Quoting',
      ],
    },
    {
      id: 6,
      title: '6. Inventory & Spare Parts',
      badge: 'Warehouse',
      color: 'border-sky-500 bg-sky-50 text-sky-700',
      steps: [
        'Purchase Stock Inward (Vendor Invoices & Batches)',
        'Technician Stock Issue & Van Inventory Allocation',
        'Job-Specific Parts Consumption & Tracking',
        'Defective Part Return / Warranty Adjustments',
        'Low Stock Alerts (Minimum Reorder Thresholds)',
        'Supplier Ledger & Purchase Order Records',
      ],
    },
    {
      id: 7,
      title: '7. Reporting & Analytics',
      badge: 'Intelligence',
      color: 'border-indigo-500 bg-indigo-50 text-indigo-700',
      steps: [
        'ISO-compliant Service Reports (PDF Download)',
        'Lift Technical Specifications & Equipment History',
        'Executive Dashboards & Live SLA KPIs',
        'Complaint Breakdown & MTTR Analytics',
        'AMC Expiry & Revenue Forecast Radar',
        'Technician Performance & First-Time Fix Rate',
      ],
    },
    {
      id: 8,
      title: '8. 24/7 Emergency Support',
      badge: '24/7 Control',
      color: 'border-emerald-500 bg-emerald-50 text-emerald-700',
      steps: [
        'Direct 24/7 Hotline Connection (+91 98201 55432)',
        'One-Tap Emergency Breakdown / SOS Call Trigger',
        'Immediate Field Engineer Emergency Dispatch',
        'Rapid Passenger Rescue & Control Room Escalation',
        'Real-Time Ticket Tracking & Safety Verification',
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header with Logo */}
      <div className="bg-gradient-to-r from-[#0c1427] via-[#123B5D] to-[#1976D2] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sky-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <WepsunLogo size="lg" theme="dark" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-2">
              Lift Service & AMC Management System
            </h1>
            <p className="text-xs sm:text-sm text-sky-200 font-medium">
              Multi-Tenant SaaS Platform — Architecture Blueprint & End-to-End Flowchart
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs text-sky-100 font-semibold">
            <span>✨ Smarter Service</span>
            <span>•</span>
            <span>🛡️ Safer Lifts</span>
            <span>•</span>
            <span>🚀 Better Tomorrow</span>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'blueprint'
                ? 'bg-[#123B5D] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-300" />
            <span>Original SaaS Flowchart Blueprint</span>
          </button>
          <button
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'interactive'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Workflow & RBAC Breakdown</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Official System Blueprint & Architecture
        </span>
      </div>

      {/* Blueprint Image Full-View */}
      {activeTab === 'blueprint' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[#263238]">
                Multi-Tenant SaaS Flowchart Blueprint (High Resolution)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Official Production Architecture
              </span>
            </div>
            <a
              href={flowchartImage}
              download="wepsun-architecture-flowchart.jpg"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </a>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
            <img
              src={flowchartImage}
              alt="WEPSUN Lift Service & AMC Management System SaaS Flowchart"
              className="w-full h-auto object-contain rounded-xl shadow-inner max-h-[85vh] cursor-zoom-in"
              onClick={() => setIsImageZoomed(true)}
            />
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Click on the image to inspect or switch to the <strong>Interactive Workflow & RBAC Breakdown</strong> tab.
          </p>
        </div>
      )}

      {/* Zoom Modal */}
      {isImageZoomed && (
        <div
          onClick={() => setIsImageZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={flowchartImage}
            alt="WEPSUN SaaS Architecture Flowchart"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* 1. Multi-Tenant Architecture Structure */}
      {activeTab === 'interactive' && (
        <>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1976D2]">
              <Layers3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#263238]">Multi-Tenant Hierarchy</h2>
              <p className="text-xs text-slate-500">Strict organizational tenant isolation data model</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 text-[#1976D2]">
            Data Isolated by Company ID
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-center space-y-1.5 flex flex-col items-center">
            <Building2 className="w-6 h-6 text-[#1976D2]" />
            <span className="font-bold text-xs text-slate-900 block">1. Company</span>
            <span className="text-[10px] text-slate-500">Tenant Parent Organization</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-1.5 flex flex-col items-center">
            <GitBranch className="w-6 h-6 text-[#2E7D32]" />
            <span className="font-bold text-xs text-slate-900 block">2. Branch</span>
            <span className="text-[10px] text-slate-500">Regional City Hub / Service Office</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-center space-y-1.5 flex flex-col items-center">
            <Building className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-xs text-slate-900 block">3. Building / Site</span>
            <span className="text-[10px] text-slate-500">Residential Tower / Commercial Mall</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-1.5 flex flex-col items-center">
            <Users className="w-6 h-6 text-amber-600" />
            <span className="font-bold text-xs text-slate-900 block">4. Client Account</span>
            <span className="text-[10px] text-slate-500">Facility Head / Society Secretary</span>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-center space-y-1.5 flex flex-col items-center">
            <Layers className="w-6 h-6 text-[#00A896]" />
            <span className="font-bold text-xs text-slate-900 block">5. Elevator Fleet</span>
            <span className="text-[10px] text-slate-500">Fleet Specifications & Directory</span>
          </div>
        </div>
      </div>

      {/* 2. User Roles & Portals Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#263238]">User Roles & Portals (7 Personas)</h2>
              <p className="text-xs text-slate-500">Granular Role-Based Access Control (RBAC)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 pt-2">
          {userRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedRole === role.id
                  ? 'border-[#1976D2] bg-blue-50/50 shadow-md ring-2 ring-[#1976D2]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center bg-gradient-to-tr ${role.color} shadow-sm`}
                >
                  {role.icon}
                </div>
                <span className="font-bold text-xs text-[#263238] block leading-snug">
                  {role.name}
                </span>
                <ul className="space-y-1 text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                  {role.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-[#1976D2] font-bold">•</span>
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive End-to-End Workflow Stages (8 Stages) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#2E7D32]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#263238]">End-to-End Operational Workflow</h2>
              <p className="text-xs text-slate-500">Interactive lifecycle stages from complaint to invoice & maintenance resolution</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {workflowStages.map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveWorkflowStage(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeWorkflowStage === st.id
                    ? 'bg-[#1976D2] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Stage {st.id}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {workflowStages.map((stage) => (
            <div
              key={stage.id}
              onClick={() => setActiveWorkflowStage(stage.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeWorkflowStage === stage.id
                  ? 'border-[#1976D2] bg-blue-50/40 shadow-md ring-2 ring-[#1976D2]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#263238]">{stage.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stage.color}`}>
                    {stage.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {stage.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="leading-snug text-[11px]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Technology Stack & Data Flow Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technology Stack Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-[#1976D2]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#263238]">Production Technology Stack</h3>
              <p className="text-xs text-slate-500">Enterprise modern full-stack ecosystem</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Core Framework</span>
              <p className="font-bold text-slate-800">Next.js / Vite + TypeScript</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">UI & Styling</span>
              <p className="font-bold text-slate-800">Tailwind CSS + Lucide Icons</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ORM & Database</span>
              <p className="font-bold text-slate-800">Prisma ORM + PostgreSQL (Supabase)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Auth & Storage</span>
              <p className="font-bold text-slate-800">Supabase Auth, RBAC & Cloud Storage</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Gateway</span>
              <p className="font-bold text-slate-800">Razorpay (Cards, UPI, Netbanking)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Messaging & Comms</span>
              <p className="font-bold text-slate-800">Twilio / MSG91 & Resend (Email)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Location & Maps</span>
              <p className="font-bold text-slate-800">Google Maps Geocoding & GPS Radar</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">AI Diagnosis</span>
              <p className="font-bold text-slate-800">Google Gemini AI Engine</p>
            </div>
          </div>
        </div>

        {/* Database Core Models */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#263238]">Database Core Models (Prisma)</h3>
              <p className="text-xs text-slate-500">Multi-tenant relational schemas & relations</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {[
              'Companies',
              'Branches',
              'Buildings',
              'Clients',
              'Lifts',
              'Users',
              'Technicians',
              'Complaints',
              'ServiceJobs',
              'ServiceRecords',
              'PMTemplates',
              'PMExecutions',
              'AMCContracts',
              'Quotations',
              'WorkOrders',
              'Invoices',
              'InventoryItems',
              'Payments',
              'Notifications',
              'AuditLogs',
              'QRTokens',
              'ServiceReports',
              'Attachments',
            ].map((model) => (
              <span
                key={model}
                className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold font-mono"
              >
                {model}
              </span>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5 mt-3">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1976D2]" />
              <span>Multi-Tenant Security Enforcement</span>
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Every database query automatically applies the <code className="font-mono font-bold text-blue-800">companyId</code> tenant filter to ensure complete isolation across different elevator maintenance vendors and agencies.
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
