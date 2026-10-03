export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'service_manager'
  | 'technician'
  | 'client'
  | 'accounts'
  | 'sales';

export interface Company {
  id: string;
  name: string;
  code: string; // e.g. "WEP", "APX"
  registrationNumber: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string; // e.g. "PUN-01", "MUM-01", "THN-01"
  city: string;
  state: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
}

export interface User {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  clientId?: string;
  technicianId?: string;
  isActive?: boolean;
  designation?: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string;
  bio?: string;
  companyName?: string;
  employeeCode?: string;
  createdAt?: string;
}

export interface DemoAccount {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  category: 'executive' | 'operations' | 'client' | 'finance' | 'multi_tenant';
  categoryLabel: string;
  email: string;
  phone: string;
  password: string;
  otp: string;
  companyId: string;
  companyName: string;
  branchId?: string;
  branchName?: string;
  clientId?: string;
  technicianId?: string;
  avatar: string;
  badgeColor: string;
  description: string;
  keyFeatures: string[];
}

export interface Building {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  address: string;
  landmark: string;
  city: string;
  pinCode: string;
  contactPerson: string;
  contactPhone: string;
  clientId: string;
  clientName: string;
  totalLifts: number;
  liftIds: string[];
  lat?: number;
  lng?: number;
}

export type LiftType = 'Passenger' | 'Hospital Stretcher' | 'Freight / Goods' | 'Capsule' | 'Hydraulic' | 'Home Lift';
export type MachineType = 'Gearless PMSM' | 'Geared Traction' | 'MRL (Machine Room-Less)' | 'Hydraulic';
export type LiftOperationalStatus = 'operational' | 'breakdown' | 'under_maintenance' | 'inspection_required';
export type AmcStatus = 'active' | 'expiring_soon' | 'expired' | 'unassigned';

export interface Lift {
  id: string;
  companyId: string;
  branchId: string;
  liftNumber: string; // Permanent Unique Lift ID, e.g. "WPS-PUN-000123"
  buildingId: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  brand: string; // e.g., "WEPSUN MRL", "Otis Gen2", "Kone MonoSpace", "Schindler 3300"
  model: string;
  type: LiftType;
  capacityPersons: number; // e.g., 8
  capacityKg: number; // e.g., 544
  speedMps: number; // e.g., 1.5
  floors: string; // e.g., "B + G + 12 Floors"
  stops: number; // e.g., 14
  machineType: MachineType;
  motorKw: number;
  controllerBrand: string; // e.g. "Monarch NICE 3000+", "Step F5021", "Arkel ARCS"
  doorOperator: string; // e.g. "Fermator VVVF4+", "Wittur Hydra"
  ardSystem: string; // e.g. "Automatic Rescue Device 415V 15KVA"
  governorSpeed: number; // e.g., 1.75 m/s
  ropeDiaMm: number; // e.g., 10mm (4:1 or 2:1)
  installationDate: string;
  warrantyExpiry: string;
  currentStatus: LiftOperationalStatus;
  amcStatus: AmcStatus;
  activeAmcId?: string;
  lastPmDate: string;
  nextPmDate: string;
  qrCodeData: string;
  qrToken?: string; // Secure token for public QR scanning
  safetyCertificateNumber: string;
  safetyCertificateExpiry: string;
  locationDetails: string; // e.g., "Wing A - Passenger Lift 1"
  drawingsUrl?: string;
  wiringDiagramUrl?: string;
}

export type ComplaintPriority = 'critical' | 'high' | 'normal';
export type ComplaintStatus =
  | 'pending'
  | 'assigned'
  | 'technician_on_way'
  | 'inspection_repair'
  | 'resolved'
  | 'closed';

export type IssueType =
  | 'stuck_passengers'
  | 'lift_not_moving'
  | 'door_jammed'
  | 'unusual_sound_vibration'
  | 'floor_leveling_error'
  | 'buttons_not_working'
  | 'ard_failure'
  | 'emergency_alarm'
  | 'water_seepage'
  | 'routine_check'
  | 'other';

export interface PartReplaced {
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ComplaintTimelineEntry {
  id: string;
  status: ComplaintStatus;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
}

export interface Complaint {
  id: string;
  companyId: string;
  branchId: string;
  ticketNumber: string; // e.g. "TKT-2026-0412"
  liftId: string;
  liftNumber: string;
  buildingId: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  issueType: IssueType;
  title: string;
  description: string;
  priority: ComplaintPriority;
  isEmergency: boolean;
  status: ComplaintStatus;
  reportedAt: string;
  assignedAt?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  technicianPhone?: string;
  technicianPhoto?: string;
  technicianEta?: string;
  checkInTime?: string;
  checkOutTime?: string;
  diagnosisRemarks?: string;
  actionTaken?: string;
  partsReplaced: PartReplaced[];
  beforePhotos: string[];
  afterPhotos: string[];
  clientSignature?: string;
  technicianSignature?: string;
  clientOtp?: string;
  clientRating?: number;
  clientFeedback?: string;
  serviceReportId?: string;
  closedAt?: string;
  timeline?: ComplaintTimelineEntry[];
  createdAt?: string;
}

export type PmZone = 'machine_room' | 'car' | 'landing' | 'pit';
export type PmItemStatus = 'ok' | 'attention' | 'faulty' | 'na';

export interface PmChecklistItem {
  id: string;
  zone: PmZone;
  name: string;
  description: string;
  status: PmItemStatus;
  remarks?: string;
  photoUrl?: string;
}

export interface PmRecord {
  id: string;
  companyId: string;
  branchId: string;
  pmNumber: string; // e.g. "PM-2026-088"
  liftId: string;
  liftNumber: string;
  buildingName: string;
  clientName: string;
  technicianId: string;
  technicianName: string;
  date: string;
  items: PmChecklistItem[];
  overallStatus: 'passed' | 'passed_with_attention' | 'critical_issues';
  remarks: string;
  technicianSignature: string;
  clientSignature?: string;
  nextPmDate: string;
}

export type AmcType = 'Comprehensive' | 'Semi-Comprehensive' | 'Non-Comprehensive';
export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'unpaid';

export interface AmcContract {
  id: string;
  companyId: string;
  branchId: string;
  contractNumber: string; // e.g. "AMC-WEP-2026-904"
  clientId: string;
  clientName: string;
  buildingId: string;
  buildingName: string;
  liftIds: string[];
  liftId?: string;
  amcType: AmcType;
  startDate: string;
  endDate: string;
  contractValue: number;
  gstRate: number; // 18%
  gstAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  coveredParts: string[];
  excludedParts: string[];
  pmFrequency: 'Monthly (12 Visits/Year)' | 'Bi-Monthly (6 Visits/Year)' | 'Quarterly (4 Visits/Year)';
  pmVisitsDone: number;
  pmVisitsTotal: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'draft';
  agreementDocumentUrl?: string;
  createdDate: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitRate: number;
  amount: number;
}

export type QuotationStatus =
  | 'draft'
  | 'sent_to_client'
  | 'approved'
  | 'rejected'
  | 'clarification_requested'
  | 'converted_to_work_order'
  | 'pending';

export interface Quotation {
  id: string;
  companyId: string;
  branchId: string;
  quoteNumber: string; // e.g. "QT-WEP-2026-031"
  quotationNumber?: string;
  complaintId?: string;
  liftId: string;
  liftNumber: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  subject: string;
  items: QuotationItem[];
  subtotal: number;
  gstRate: number; // 18%
  gstAmount: number;
  grandTotal: number;
  totalAmount?: number;
  terms: string[];
  status: QuotationStatus;
  clarificationNotes?: string;
  clientFeedback?: string;
  createdAt: string;
  validUntil: string;
  convertedToWorkOrderId?: string;
}

export type WorkOrderStatus = 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WorkOrder {
  id: string;
  companyId: string;
  branchId: string;
  workOrderNumber: string; // e.g. "WO-2026-0045"
  quotationId?: string;
  complaintId?: string;
  liftId: string;
  liftNumber: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  technicianId?: string;
  technicianName?: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduledDate: string;
  estimatedHours: number;
  totalAmount: number;
  invoiceId?: string;
  createdAt: string;
  completedAt?: string;
  remarks?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  branchId: string;
  invoiceNumber: string; // e.g. "INV-WEP-2026-102"
  clientId: string;
  clientName: string;
  buildingName: string;
  liftId?: string;
  liftNumber?: string;
  type: 'AMC Contract' | 'Breakdown Repair' | 'Parts Replacement' | 'Modernization';
  relatedContractId?: string;
  relatedQuoteId?: string;
  relatedWorkOrderId?: string;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  totalAmount?: number;
  paidAmount: number;
  balanceDue?: number;
  status: PaymentStatus;
  dueDate: string;
  dateDue?: string;
  invoiceDate: string;
  paymentMethod?: 'UPI / QR' | 'NEFT / RTGS' | 'Credit Card' | 'Cheque';
  transactionId?: string;
  paymentDate?: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  branchId: string;
  partNumber: string;
  name: string;
  category: 'electrical' | 'mechanical' | 'electronic' | 'safety' | 'consumable';
  currentStock: number;
  minStockThreshold: number;
  unit: 'Nos' | 'Meters' | 'Sets' | 'Liters' | 'Rolls';
  purchasePrice: number;
  sellingPrice: number;
  hsnCode: string;
  supplier: string;
  locationRack: string;
  compatibleModels: string[];
  imageUrl?: string;
}

export type InventoryMovementType =
  | 'PURCHASE'
  | 'TECHNICIAN_ISSUE'
  | 'JOB_CONSUMPTION'
  | 'RETURN'
  | 'ADJUSTMENT';

export interface InventoryMovement {
  id: string;
  companyId: string;
  branchId: string;
  partId: string;
  partNumber: string;
  partName: string;
  type: InventoryMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceId?: string; // ticketId, workOrderId, invoiceId, poNumber
  technicianId?: string;
  technicianName?: string;
  performedBy: string;
  notes: string;
  timestamp: string;
}

export interface Technician {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  employeeCode: string;
  phone: string;
  email: string;
  avatar: string;
  zone: string;
  currentStatus: 'available' | 'on_job' | 'traveling' | 'off_duty';
  activeJobId?: string;
  currentLocationName?: string;
  lat?: number;
  lng?: number;
  totalResolved: number;
  avgResolutionMinutes: number;
  customerRating: number;
  totalRatingsCount: number;
  repeatComplaintRatePct: number;
  pmCompletionPct: number;
  monthlyRevenueContribution: number;
  branchName?: string;
  baseHub?: string;
  vehicleNumber?: string;
  specialization?: string;
  certifications?: string[];
  bio?: string;
}

export interface GPSCheckIn {
  id: string;
  companyId: string;
  ticketId: string;
  technicianId: string;
  technicianName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  locationAddress: string;
  checkInTime: string;
  distanceFromSiteMeters?: number;
  isVerified: boolean;
}

export interface ServiceReport {
  id: string;
  companyId: string;
  branchId: string;
  clientId?: string;
  reportNumber: string; // e.g. "SR-2026-0542"
  ticketId: string;
  ticketNumber: string;
  liftId: string;
  liftNumber: string;
  liftBrand: string;
  liftModel: string;
  buildingName: string;
  buildingAddress: string;
  clientName: string;
  clientContact: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  serviceDate: string;
  serviceStartTime: string;
  serviceEndTime: string;
  serviceType: 'Breakdown Repair' | 'Preventive Maintenance' | 'Emergency Call' | 'Modernization Inspection';
  initialDiagnosis: string;
  rootCause: string;
  workPerformed: string;
  partsReplaced: PartReplaced[];
  technicianRecommendations: string;
  liftOperatingStatusAfterWork: 'Fully Operational & Safe' | 'Operational with Observation' | 'Shut Down (Parts Pending)';
  beforePhotos: string[];
  afterPhotos: string[];
  technicianSignature: string;
  clientSignature: string;
  clientOtpVerified: boolean;
  clientRating?: number;
  clientFeedback?: string;
  createdAt: string;
}

export interface PartReplacementRecord {
  id: string;
  liftId: string;
  liftNumber: string;
  buildingName: string;
  clientId: string;
  partName: string;
  partNumber: string;
  oldPartSerial?: string;
  newPartSerial?: string;
  replacementDate: string;
  reason: string;
  technicianName: string;
  warranty: string;
  cost: number;
  isAmcCovered: boolean;
  invoiceNumber?: string;
  jobId: string;
}

export interface ClientProfile {
  clientId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  gstin?: string;
  logo?: string;
  registeredBuildings: string[];
  totalLifts: number;
}

export interface ClientNotification {
  id: string;
  clientId: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'complaint' | 'technician' | 'pm' | 'amc' | 'quotation' | 'payment' | 'system';
  isRead: boolean;
  actionTab?: string;
  referenceId?: string;
}

export interface AiErrorCode {
  id: string;
  code: string;
  driveBrand: 'Monarch' | 'Step' | 'Arkel' | 'Inovance' | 'Generic VVVF' | 'Otis' | 'Schindler' | 'Kone';
  errorName: string;
  severity: 'critical' | 'high' | 'warning';
  symptoms: string[];
  possibleCauses: string[];
  stepByStepRemedy: string[];
  safetyPrecautions: string[];
  suggestedParts?: string[];
}

export interface BusinessEnquiry {
  id: string;
  companyId?: string;
  clientName: string;
  phone: string;
  email: string;
  societyOrBuilding: string;
  city: string;
  enquiryType:
    | 'Turnkey Lift Installation'
    | 'Annual Maintenance Contract (AMC)'
    | 'Emergency Breakdown Service'
    | 'Lift Modernization & Refurbishment'
    | 'Annual Safety Audit & Compliance'
    | 'Spare Parts & Component Replacement'
    | string;
  numberOfLifts: number;
  numberOfFloors: number;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'quote_sent' | 'closed';
}

export interface AuditLog {
  id: string;
  companyId: string;
  entityType: 'Lift' | 'Complaint' | 'AmcContract' | 'Quotation' | 'WorkOrder' | 'Invoice' | 'Inventory' | 'Technician' | 'Building' | 'Company';
  entityId: string;
  action: string;
  performedBy: string;
  userRole: string;
  details: string;
  timestamp: string;
}

export interface QRCodeToken {
  token: string;
  liftId: string;
  companyId: string;
  generatedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface CustomerFeedback {
  id: string;
  companyId: string;
  branchId?: string;
  ticketId?: string;
  ticketNumber?: string;
  serviceReportId?: string;
  liftId: string;
  liftNumber: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  technicianId?: string;
  technicianName?: string;
  overallRating: number; // 1 to 5
  ratingsBreakdown?: {
    punctuality: number; // 1 to 5
    technicalSkill: number; // 1 to 5
    communication: number; // 1 to 5
    rideSmoothness: number; // 1 to 5
  };
  serviceType: 'Breakdown Resolution' | 'Routine PM Visit' | 'Annual Safety Inspection' | 'Parts Replacement' | 'Modernization';
  tags?: string[];
  comments: string;
  status: 'published' | 'under_review' | 'action_taken';
  adminReply?: {
    message: string;
    repliedBy: string;
    repliedAt: string;
  };
  createdAt: string;
}

export type JobType =
  | 'Breakdown'
  | 'Preventive Maintenance (PM)'
  | 'Installation'
  | 'Repair'
  | 'Emergency Call';

export type JobPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export type JobWorkflowStatus =
  | 'Assigned'
  | 'Accepted'
  | 'On The Way'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Checked Out';

export type LiftSafetyMarker = 'Safe to Operate' | 'Temporarily Unsafe' | 'Out of Service';

export type PartCondition =
  | 'Brand New (OEM)'
  | 'Tested / Working'
  | 'Worn Out / Fatigued'
  | 'Burnt / Electrical Failure'
  | 'Mechanically Damaged'
  | 'Missing / Broken';

export interface TechnicianPartItem {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  category: string;
  quantityIssued: number;
  quantityUsed: number;
  quantityReturned: number;
  unitCost: number;
  totalCost: number;
  warranty: string;
  serialNumber?: string;
  reasonForReplacement: string;
  oldPartCondition: PartCondition;
  newPartCondition: PartCondition;
  inventoryReference: string;
}

export interface TechnicianJob {
  id: string;
  jobId: string; // e.g. "JOB-2026-0412" or "TKT-2026-0412"
  jobType: JobType;
  priority: JobPriority;
  clientName: string;
  clientId: string;
  contactPerson: string;
  clientPhone: string;
  clientEmail: string;
  serviceAddress: string;
  buildingName: string;
  buildingId: string;
  liftId: string;
  liftNumber: string;
  locationDetails: string;
  scheduledDate: string;
  scheduledTime: string;
  jobStatus: JobWorkflowStatus;
  estimatedDuration: string; // e.g. "45 mins", "2 hours"
  assignedBy: string; // e.g. "Sanjay Deshmukh (Service Head)"
  assignedAt: string;
  technicianId: string;
  technicianName: string;

  // Timings & Attendance
  checkInDate?: string;
  checkInTime?: string;
  checkInGps?: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    address: string;
    isVerified: boolean;
  };
  checkOutDate?: string;
  checkOutTime?: string;
  totalDurationMinutes?: number;

  // Fault Diagnosis & Work
  complaintReported: string;
  faultCategory?: string;
  faultCode?: string;
  symptomsObserved?: string[];
  diagnosis?: string;
  rootCause?: string;
  safetyIssuesIdentified?: string;
  inspectionFindings?: string;
  correctiveAction?: string;
  workPerformed?: string;
  technicianRemarks?: string;
  recommendations?: string;
  furtherActionRequired?: boolean;
  followUpDate?: string;
  liftSafetyStatus?: LiftSafetyMarker;

  // Parts
  parts: TechnicianPartItem[];

  // Evidence Photos/Videos
  beforeEvidence: {
    id: string;
    type: 'photo' | 'video';
    url: string;
    description: string;
    uploadedAt: string;
  }[];
  afterEvidence: {
    id: string;
    type: 'photo' | 'video';
    url: string;
    description: string;
    uploadedAt: string;
  }[];

  // Signature & Confirmation
  clientNameSigned?: string;
  clientDesignation?: string;
  clientSignature?: string;
  technicianSignature?: string;
  signatureDate?: string;
  workCompletionConfirmed?: boolean;

  // OTP Verification
  clientOtp?: string;
  otpSent?: boolean;
  otpSentAt?: string;
  otpVerified?: boolean;
  otpVerifiedAt?: string;
  otpAttempts?: number;
  otpExpiryMinutes?: number;

  // Service Report
  serviceReportNumber?: string;
  serviceReportGeneratedAt?: string;
}

export interface TechNotificationItem {
  id: string;
  technicianId: string;
  type:
    | 'job_assigned'
    | 'job_rescheduled'
    | 'emergency_call'
    | 'client_clarification'
    | 'job_reminder'
    | 'parts_issued'
    | 'job_completion'
    | 'otp_confirmation'
    | 'service_report_generated';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  jobId?: string;
  priority: 'normal' | 'high' | 'urgent';
}


