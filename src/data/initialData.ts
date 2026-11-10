import {
  Company,
  Branch,
  Building,
  Lift,
  Complaint,
  PmChecklistItem,
  AmcContract,
  Quotation,
  WorkOrder,
  Invoice,
  InventoryItem,
  InventoryMovement,
  Technician,
  ServiceReport,
  AiErrorCode,
  User,
  DemoAccount,
  BusinessEnquiry,
  CustomerFeedback,
  AuditLog,
  PartReplacementRecord,
  ClientNotification,
  AppNotification,
} from '../types/index.js';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'WEPSUN Engineering Solution Pvt. Ltd.',
    code: 'WEP',
    registrationNumber: 'U29100MH2018PTC318920',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=100&auto=format&fit=crop&q=80',
    contactEmail: 'service@wepsun.com',
    contactPhone: '+91 85959 40077',
    address: 'Unit 402, Quantum Towers, SV Road, Malad West',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstNumber: '27AABCW1234F1Z8',
    isActive: true,
    createdAt: '2018-05-15T10:00:00+05:30',
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-mum-1',
    companyId: 'comp-1',
    name: 'Mumbai Central & Western Branch',
    code: 'MUM-01',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Andheri East, Metro Station Complex, Mumbai 400069',
    contactPerson: 'Sanjay Deshmukh',
    contactPhone: '+91 98202 88765',
    contactEmail: 'mumbai.service@wepsun.com',
    isActive: true,
  },
  {
    id: 'br-thn-1',
    companyId: 'comp-1',
    name: 'Thane & Navi Mumbai Branch',
    code: 'THN-01',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    address: 'Sector 19, Vashi, Navi Mumbai 400703',
    contactPerson: 'Prakash Kadam',
    contactPhone: '+91 98205 33441',
    contactEmail: 'vashi.service@wepsun.com',
    isActive: true,
  },
  {
    id: 'br-pune-1',
    companyId: 'comp-1',
    name: 'Pune Central Branch',
    code: 'PUN-01',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Off FC Road, Shivajinagar, Pune 411005',
    contactPerson: 'Ramesh Joshi',
    contactPhone: '+91 98220 12345',
    contactEmail: 'pune.service@wepsun.com',
    isActive: true,
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-master-sumit',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    name: 'Sumit Jaiswal (Master Admin)',
    email: 'jaiswalsumit2812@gmail.com',
    phone: '+91 98201 99928',
    role: 'master_admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'usr-master-gaurav',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    name: 'Gaurav Saini (Master Admin)',
    email: 'gauravsaini0004@gmail.com',
    phone: '+91 98201 92025',
    role: 'master_admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'usr-client-1791564102599',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    name: 'Vighnesh Kulkarni',
    email: 'vighneshkulkarni897530@gmail.com',
    phone: '7391010883',
    role: 'client',
    clientId: 'client-1791564102599',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  }
];

export const DEMO_ACCOUNTS: DemoAccount[] = [];

export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'bld-vighnesh-1',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    name: 'Vighnesh Kulkarni Heights',
    address: 'Palm Beach Road, Sector 19, Vashi',
    landmark: 'Near Vashi Railway Station',
    city: 'Navi Mumbai',
    pinCode: '400703',
    contactPerson: 'Vighnesh Kulkarni',
    contactPhone: '7391010883',
    clientId: 'client-1791564102599',
    clientName: 'Vighnesh Kulkarni Property',
    totalLifts: 2,
    liftIds: ['lift-vighnesh-1', 'lift-vighnesh-2'],
    lat: 19.0760,
    lng: 72.9980,
  },
];

export const INITIAL_LIFTS: Lift[] = [
  {
    id: 'lift-vighnesh-1',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    liftNumber: 'WPS-DD037-01',
    buildingId: 'bld-vighnesh-1',
    buildingName: 'Vighnesh Kulkarni Heights',
    clientId: 'client-1791564102599',
    clientName: 'Vighnesh Kulkarni',
    clientPhone: '7391010883',
    brand: 'WEPSUN Gearless PMSM',
    model: 'AeroGlide-V3',
    type: 'Passenger',
    capacityPersons: 10,
    capacityKg: 680,
    speedMps: 1.5,
    floors: 'G + 14 Floors',
    stops: 15,
    machineType: 'Gearless PMSM',
    motorKw: 7.5,
    controllerBrand: 'Monarch NICE 3000+',
    doorOperator: 'Fermator VVVF4+',
    ardSystem: 'WEPSUN Smart ARD 15kVA Auto-Rescue',
    governorSpeed: 1.75,
    ropeDiaMm: 10,
    installationDate: '2024-01-15',
    warrantyExpiry: '2027-01-15',
    currentStatus: 'operational',
    amcStatus: 'active',
    lastPmDate: '2026-10-15',
    nextPmDate: '2026-11-15',
    qrCodeData: 'WPS-DD037-01',
    qrToken: 'wep-token-vk-001',
    safetyCertificateNumber: 'MH-EI-LIFT-2026-99124',
    safetyCertificateExpiry: '2027-05-31',
    locationDetails: 'Wing A - Passenger Elevator',
  },
  {
    id: 'lift-vighnesh-2',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    liftNumber: 'WPS-DD037-02',
    buildingId: 'bld-vighnesh-1',
    buildingName: 'Vighnesh Kulkarni Heights',
    clientId: 'client-1791564102599',
    clientName: 'Vighnesh Kulkarni',
    clientPhone: '7391010883',
    brand: 'WEPSUN Gearless PMSM',
    model: 'AeroGlide-V3',
    type: 'Passenger',
    capacityPersons: 10,
    capacityKg: 680,
    speedMps: 1.5,
    floors: 'G + 14 Floors',
    stops: 15,
    machineType: 'Gearless PMSM',
    motorKw: 7.5,
    controllerBrand: 'Monarch NICE 3000+',
    doorOperator: 'Fermator VVVF4+',
    ardSystem: 'WEPSUN Smart ARD 15kVA Auto-Rescue',
    governorSpeed: 1.75,
    ropeDiaMm: 10,
    installationDate: '2024-01-15',
    warrantyExpiry: '2027-01-15',
    currentStatus: 'operational',
    amcStatus: 'active',
    lastPmDate: '2026-10-15',
    nextPmDate: '2026-11-15',
    qrCodeData: 'WPS-DD037-02',
    qrToken: 'wep-token-vk-002',
    safetyCertificateNumber: 'MH-EI-LIFT-2026-99125',
    safetyCertificateExpiry: '2027-05-31',
    locationDetails: 'Wing B - Service Elevator',
  },
];

export const INITIAL_TECHNICIANS: Technician[] = [];

export const INITIAL_COMPLAINTS: Complaint[] = [];

export const INITIAL_PM_CHECKLIST_TEMPLATE: PmChecklistItem[] = [
  // Zone 1: Machine Room / MRL (machine, brake, encoder, controller, SMPS, MCB, VVVF and wiring)
  {
    id: 'pm-mr-1',
    zone: 'machine_room',
    name: 'Traction Machine & Bearing Lubrication',
    description: 'Inspect PMSM gearless/geared machine, bearing temperature, gearbox oil level, sheaves and seal leakages.',
    status: 'ok',
  },
  {
    id: 'pm-mr-2',
    zone: 'machine_room',
    name: 'Electro-Mechanical Brake Assembly & Microswitches',
    description: 'Check brake shoe wear, plunger stroke clearance (0.25mm), microswitch operation, manual release lever.',
    status: 'ok',
  },
  {
    id: 'pm-mr-3',
    zone: 'machine_room',
    name: 'Motor Encoder & Speed Feedback Pulse Cable',
    description: 'Verify encoder coupling alignment, shielding ground continuity, PG card connection, pulse stability.',
    status: 'ok',
  },
  {
    id: 'pm-mr-4',
    zone: 'machine_room',
    name: 'Main Controller, SMPS & MCB Power Distribution',
    description: 'Blow dust with blower, check contactor tips, inspect MCB trip ratings, verify 24V DC / 110V DC SMPS output.',
    status: 'ok',
  },
  {
    id: 'pm-mr-5',
    zone: 'machine_room',
    name: 'VVVF Inverter Drive & Cooling Fan',
    description: 'Inspect drive cooling heat-sink fan, check error log buffer, measure DC bus capacitor voltage ripple.',
    status: 'ok',
  },
  {
    id: 'pm-mr-6',
    zone: 'machine_room',
    name: 'Control Panel Wiring & Earth Ground Continuity',
    description: 'Check terminal screw tightness, wiring insulation, earth fault loop impedance, ferruling correctness.',
    status: 'ok',
  },
  {
    id: 'pm-mr-7',
    zone: 'machine_room',
    name: 'Overspeed Governor & Safety Electrical Switch',
    description: 'Verify governor latch mechanism, electrical trip contact, test-spin manual centrifugal fly-weight.',
    status: 'ok',
  },
  {
    id: 'pm-mr-8',
    zone: 'machine_room',
    name: 'Automatic Rescue Device (ARD) Battery Bank',
    description: 'Check individual 12V SMF battery voltages under load; verify automatic mains cutover rescue mode.',
    status: 'ok',
  },

  // Zone 2: Car (door, coupler, door sensor, COP, fan/light, emergency alarm and ARD)
  {
    id: 'pm-car-1',
    zone: 'car',
    name: 'Car Door Operator, Motor Drive & Belt',
    description: 'Inspect door drive timing belt tension, motor encoder, speed profiles, car door skate alignment.',
    status: 'ok',
  },
  {
    id: 'pm-car-2',
    zone: 'car',
    name: 'Door Coupler & Clutch Knife Mechanism',
    description: 'Check clutch knife engagement clearance (6-8mm), roller play, lock release synchronizer.',
    status: 'ok',
  },
  {
    id: 'pm-car-3',
    zone: 'car',
    name: 'Infrared Multi-Beam Door Sensor & Safety Edge',
    description: 'Test full optical curtain blockage, safety edge reverse retract trigger, audio safety buzzer.',
    status: 'ok',
  },
  {
    id: 'pm-car-4',
    zone: 'car',
    name: 'Car Operating Panel (COP) & Push Buttons',
    description: 'Check all floor buttons, tactile Braille response, call registration LED feedback, digital position display.',
    status: 'ok',
  },
  {
    id: 'pm-car-5',
    zone: 'car',
    name: 'Cabin Cross-Flow Fan & LED Ceiling Lighting',
    description: 'Verify cabin ventilation fan air throughput, silent operation, LED diffuser illumination, emergency light.',
    status: 'ok',
  },
  {
    id: 'pm-car-6',
    zone: 'car',
    name: 'Emergency Alarm Push Button & 2-Way Intercom',
    description: 'Test in-car alarm bell siren, 2-way master intercom audio to building security desk / control room.',
    status: 'ok',
  },
  {
    id: 'pm-car-7',
    zone: 'car',
    name: 'ARD In-Cabin Safety & Emergency Light Indicator',
    description: 'Verify emergency rescue indicator illuminates and audio voice advisory triggers when mains power cuts.',
    status: 'ok',
  },
  {
    id: 'pm-car-8',
    zone: 'car',
    name: 'Car Top Inspection Station & Emergency STOP',
    description: 'Test Up/Down inspection run buttons, common enable switch, emergency stop safety cut-off.',
    status: 'ok',
  },
  {
    id: 'pm-car-9',
    zone: 'car',
    name: 'Car Guide Shoes & Lubricators',
    description: 'Check nylon / polyurethane guide shoe liner wear, refill ISO VG 68 guide rail lubricating oil pots.',
    status: 'ok',
  },

  // Zone 3: Landing (door lock, roller, sill, push button and indicator)
  {
    id: 'pm-lnd-1',
    zone: 'landing',
    name: 'Landing Door Locks & Electrical Interlock Contact Beaks',
    description: 'Test positive mechanical latch engagement (min 7mm) and electrical safety interlock contacts on all floors.',
    status: 'ok',
  },
  {
    id: 'pm-lnd-2',
    zone: 'landing',
    name: 'Door Hanger Rollers & Re-closing Weight / Spring',
    description: 'Inspect upper hanger rollers, eccentric locking rollers, ensure self-closing from 50mm ajar position.',
    status: 'ok',
  },
  {
    id: 'pm-lnd-3',
    zone: 'landing',
    name: 'Landing Door Sills, Dust Grooves & Bottom Gibs',
    description: 'Clean debris from aluminum sills, check bottom nylon door shoes/gibs for excessive lateral play.',
    status: 'ok',
  },
  {
    id: 'pm-lnd-4',
    zone: 'landing',
    name: 'Hall Call Push Button Stations (LOP) & Indicators',
    description: 'Inspect illumination of Up/Down hall call buttons, direction arrows, position chimes on all landing floors.',
    status: 'ok',
  },

  // Zone 4: Pit (buffer, limit switch, governor, tension pulley, pit lighting and water level)
  {
    id: 'pm-pit-1',
    zone: 'pit',
    name: 'Car & Counterweight Buffers (Spring / Hydraulic)',
    description: 'Verify buffer stroke, oil level in hydraulic pistons, plunger corrosion, electrical buffer safety switch.',
    status: 'ok',
  },
  {
    id: 'pm-pit-2',
    zone: 'pit',
    name: 'Final Upper & Lower Terminal Directional Limit Switches',
    description: 'Check normal terminal stopping limit and final overtravel safety switch contact opening.',
    status: 'ok',
  },
  {
    id: 'pm-pit-3',
    zone: 'pit',
    name: 'Overspeed Governor Tension Pulley & Slack Rope Switch',
    description: 'Inspect pit tension weight clearance from floor (min 150mm), rope groove wear, slack rope limit switch.',
    status: 'ok',
  },
  {
    id: 'pm-pit-4',
    zone: 'pit',
    name: 'Pit Emergency Stop Switch & Pit IP65 Lighting',
    description: 'Test pit STOP push button cuts safety circuit immediately; check pit IP65 flood light and 230V socket.',
    status: 'ok',
  },
  {
    id: 'pm-pit-5',
    zone: 'pit',
    name: 'Pit Cleanliness & Water Level / Sump Ingress Sensor',
    description: 'Ensure dry pit floor, zero oil/water accumulation, functioning water alarm sensor if installed.',
    status: 'ok',
  }
];

export const INITIAL_AMC_CONTRACTS: AmcContract[] = [];

export const INITIAL_QUOTATIONS: Quotation[] = [];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-INV-DRV101',
    name: 'Monarch NICE 3000+ Integrated Lift Controller (11kW)',
    category: 'electronic',
    currentStock: 4,
    minStockThreshold: 2,
    unit: 'Nos',
    purchasePrice: 42000,
    sellingPrice: 56000,
    hsnCode: '85044090',
    supplier: 'Monarch Inovance Technology India Ltd.',
    locationRack: 'Rack E-04 (Vashi Central Store)',
    compatibleModels: ['WEPSUN MRL', 'Monarch NICE 1000/3000', 'Generic VVVF'],
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'inv-2',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-SENS-LC32',
    name: '32-Channel Smart Multi-Beam Infrared Light Curtain (940nm)',
    category: 'safety',
    currentStock: 12,
    minStockThreshold: 5,
    unit: 'Sets',
    purchasePrice: 4200,
    sellingPrice: 6500,
    hsnCode: '84313100',
    supplier: 'WEPSUN Precision Safety Optics',
    locationRack: 'Rack S-01 (Optics Bay)',
    compatibleModels: ['Universal All Brands (Otis, Kone, Schindler, WEPSUN)'],
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'inv-3',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-SW-LCK102',
    name: 'Landing Door Lock Interlock Switch Beak Assembly',
    category: 'safety',
    currentStock: 28,
    minStockThreshold: 10,
    unit: 'Nos',
    purchasePrice: 1100,
    sellingPrice: 1850,
    hsnCode: '85365090',
    supplier: 'Fermator India Components Pvt. Ltd.',
    locationRack: 'Bin D-12 (Mechanical Locks)',
    compatibleModels: ['Fermator VVVF4+', 'Wittur Hydra', 'WEPSUN Automatic']
  },
  {
    id: 'inv-4',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-BAT-12V26',
    name: 'ARD 12V 26Ah Sealed Maintenance Free (SMF) Battery',
    category: 'electrical',
    currentStock: 18,
    minStockThreshold: 8,
    unit: 'Nos',
    purchasePrice: 2800,
    sellingPrice: 3900,
    hsnCode: '85072000',
    supplier: 'Exide Industries Industrial Power',
    locationRack: 'Battery Rack B-02',
    compatibleModels: ['WEPSUN Smart ARD', 'High-Capacity 15-30kVA Rescue Units']
  },
  {
    id: 'inv-5',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-COP-BTN01',
    name: 'Braille Micro-Push Button with Blue LED Halo Ring',
    category: 'electrical',
    currentStock: 65,
    minStockThreshold: 20,
    unit: 'Nos',
    purchasePrice: 350,
    sellingPrice: 650,
    hsnCode: '85365090',
    supplier: 'Dewhurst Elevator Fixtures Ltd.',
    locationRack: 'Bin E-08 (COP/LOP Spares)',
    compatibleModels: ['All Standard COP/LOP Car Operating Panels']
  },
  {
    id: 'inv-6',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-OIL-VG68',
    name: 'ISO VG 68 Heavy Duty Guide Rail Lubricating Oil (5 Liter)',
    category: 'consumable',
    currentStock: 15,
    minStockThreshold: 6,
    unit: 'Liters',
    purchasePrice: 1400,
    sellingPrice: 2200,
    hsnCode: '27101980',
    supplier: 'Castrol Industrial Lubricants',
    locationRack: 'Chemical Drum Bay C-01',
    compatibleModels: ['Traction Elevator Counterweight & Car T-Rails (T75/T89/T127)']
  },
  {
    id: 'inv-7',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-BRK-COIL415',
    name: 'Electromagnetic Brake Coil & Rectifier Assembly (110V DC)',
    category: 'mechanical',
    currentStock: 3,
    minStockThreshold: 2,
    unit: 'Sets',
    purchasePrice: 9500,
    sellingPrice: 14500,
    hsnCode: '85059000',
    supplier: 'Binder Magnete India Ltd.',
    locationRack: 'Heavy Rack H-03',
    compatibleModels: ['Montanari Gearless', 'Torin Drive PMSM', 'WEPSUN Max']
  },
  {
    id: 'inv-8',
    companyId: 'comp-1',
    branchId: 'br-thn-1',
    partNumber: 'WEP-SNS-LVL301',
    name: 'Bistable Magnetic Leveling Reed Switch',
    category: 'electronic',
    currentStock: 22,
    minStockThreshold: 8,
    unit: 'Nos',
    purchasePrice: 750,
    sellingPrice: 1200,
    hsnCode: '85365090',
    supplier: 'Bernstein AG Industrial Sensors',
    locationRack: 'Bin S-04 (Magnetic Sensors)',
    compatibleModels: ['Monarch, Step, Arkel Leveling Vanes']
  }
];

export const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [];

export const INITIAL_SERVICE_REPORTS: ServiceReport[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const AI_ERROR_CODES_DATABASE: AiErrorCode[] = [
  {
    id: 'err-mn-01',
    code: 'E01',
    driveBrand: 'Monarch',
    errorName: 'Inverter Overcurrent during Acceleration (OC-ACC)',
    severity: 'critical',
    symptoms: [
      'Lift trips immediately when attempting to move upward or downward from landing',
      'Loud humming from traction motor followed by safety relay disengagement',
      'Monarch keypad displays E01 flashing'
    ],
    possibleCauses: [
      'Short circuit or earth ground leakage in motor power UVW output wiring',
      'Mechanical brake is not opening fully, causing rotor lockup against energized motor',
      'Motor encoder phase angle out of calibration (SIN/COS offset drift)',
      'Drive acceleration time parameter (F0-14) set too short for heavy cabin load'
    ],
    stepByStepRemedy: [
      'STEP 1: Disconnect mains 415V power and check U-V-W motor cables using 500V Megger for earth leakage (must be > 10 Megohms).',
      'STEP 2: Inspect mechanical brake arm movement during call. Ensure brake microswitch energizes 110V DC coil and brake shoes clear the rim by 0.25mm.',
      'STEP 3: Check encoder parameter F1-00 (Encoder Type) and F1-12 (Encoder Angle). Perform static encoder angle auto-tuning if motor is PMSM.',
      'STEP 4: Increase acceleration time F0-14 from 2.2s to 2.8s in Monarch controller menu.'
    ],
    safetyPrecautions: [
      'DO NOT bypass brake microswitches.',
      'Lock out main 415V MCB before probing UVW motor terminals.',
      'Always secure car with counterweight buffer props or safety gear before loosening brake manual release.'
    ],
    suggestedParts: ['Siemens 24V Contactor', 'Monarch NICE 3000+ Inverter', 'Optical Encoder Cable']
  },
  {
    id: 'err-mn-02',
    code: 'E02',
    driveBrand: 'Monarch',
    errorName: 'Inverter Overcurrent during Deceleration (OC-DEC)',
    severity: 'critical',
    symptoms: [
      'Lift travels smoothly at full speed but trips abruptly when decelerating near destination floor',
      'Cabin passengers experience sudden jerk at leveling zone'
    ],
    possibleCauses: [
      'Dynamic braking resistor open-circuited or blown thermal fuse',
      'Regenerative energy exceeds DC bus braking unit threshold',
      'Deceleration time parameter (F0-15) too steep'
    ],
    stepByStepRemedy: [
      'STEP 1: Measure resistance across terminals (+) and (PB) on Monarch drive; verify against braking resistor rating (typically 40-75 Ohms).',
      'STEP 2: Check DC bus voltage during deceleration using multimeter; ensure it does not exceed 750V DC.',
      'STEP 3: Increase deceleration curve parameter F0-15 and smooth out S-curve rounding (F0-16).'
    ],
    safetyPrecautions: [
      'Braking resistor surfaces can exceed 150°C. Do not touch bare metal fins.'
    ],
    suggestedParts: ['Dynamic Braking Resistor 1000W 50 Ohm']
  },
  {
    id: 'err-mn-33',
    code: 'E33',
    driveBrand: 'Monarch',
    errorName: 'Elevator Speed Feedback Error / Encoder Fault',
    severity: 'critical',
    symptoms: [
      'Lift attempts movement for 2 seconds, jerks slightly, and locks out safety chain',
      'Display shows E33'
    ],
    possibleCauses: [
      'Encoder cable connector loose or shielding wire broken',
      'A/B pulse channels wired in reverse phase',
      'Encoder optical disc cracked or contaminated with oil'
    ],
    stepByStepRemedy: [
      'STEP 1: Inspect PG encoder card seated on NICE 3000 motherboard; reseat DB15 / terminal block.',
      'STEP 2: Swap A and B phase pulses or invert parameter F1-01 (Encoder Direction).',
      'STEP 3: Measure +5V DC encoder supply voltage at motor terminal box under load.'
    ],
    safetyPrecautions: [
      'Ensure car is locked in inspection mode before testing pulse direction.'
    ],
    suggestedParts: ['1024 PPR Rotary Optical Encoder', 'PG-E01 PG Card']
  },
  {
    id: 'err-mn-51',
    code: 'E51',
    driveBrand: 'Monarch',
    errorName: 'Door Lock Interlock Circuit Broken during Running',
    severity: 'critical',
    symptoms: [
      'Lift stops dead between floors and emergency alarm activates',
      'Door lock indicator LED (DL) on motherboard turns OFF while lift is in motion'
    ],
    possibleCauses: [
      'Landing door interlock contact beak worn out on a specific floor',
      'Car door lock latch switch bounced open due to shaft air draft or loose roller',
      'Door skate hitting a misaligned landing door sill roller while in high-speed flight'
    ],
    stepByStepRemedy: [
      'STEP 1: Switch to Inspection Mode on car top or controller panel.',
      'STEP 2: Move car slowly up/down to identify which floor door lock contact loses continuity.',
      'STEP 3: Check clearance between car door clutch knife (skate) and landing lock rollers (must be 6mm-8mm in running flight).',
      'STEP 4: Clean silver contacts of landing door lock beak with contact cleaner and adjust spring tension.'
    ],
    safetyPrecautions: [
      'NEVER put a permanent jumper on door lock terminals (110 / 112). Doing so is an extreme life safety violation.'
    ],
    suggestedParts: ['Landing Door Lock Interlock Switch Beak', 'Fermator Clutch Roller Set']
  },
  {
    id: 'err-stp-02',
    code: 'Er02',
    driveBrand: 'Step',
    errorName: 'Step Inverter Motor Overload (OL1)',
    severity: 'high',
    symptoms: [
      'Lift works normally with empty car, but trips when 4 or more passengers board',
      'Step F5021 LCD displays "Er02 Motor Overload"'
    ],
    possibleCauses: [
      'Counterweight balance ratio incorrect (should be 45%-50% of rated capacity)',
      'Guide rails lacking lubrication, causing excessive frictional drag',
      'Motor thermal thermistor tripping due to restricted machine room ventilation'
    ],
    stepByStepRemedy: [
      'STEP 1: Verify counterweight balance by placing 50% rated load (e.g. 272kg for 8pax) in car and parking at mid-shaft. Check motor torque current on inverter display.',
      'STEP 2: Inspect guide rails for dry scoring. Refill automatic rail lubricator guide shoe oil reservoirs (ISO VG 68 oil).',
      'STEP 3: Inspect machine room exhaust fan to prevent ambient temperature exceeding 40°C.'
    ],
    safetyPrecautions: [
      'Keep hair and clothing clear of counterweight sheaves while balancing.'
    ],
    suggestedParts: ['ISO VG 68 Guide Rail Lubricant Oil', 'Guide Shoe Liners']
  },
  {
    id: 'err-ots-0100',
    code: '0100',
    driveBrand: 'Otis',
    errorName: 'Otis Safety Chain Open (Drive Op Mode SOS)',
    severity: 'critical',
    symptoms: [
      'Lift will not respond to any hall or car call; status indicator shows SOS',
      'Safety circuit LED on GECB panel is dark'
    ],
    possibleCauses: [
      'Pit emergency stop switch pressed or water sensor triggered',
      'Overspeed governor switch tripped',
      'Car top inspection box emergency stop engaged',
      'Final limit switch activated due to overtravel'
    ],
    stepByStepRemedy: [
      'STEP 1: Connect Service Tool (SVTool) to GECB port (Menu 1-1-1).',
      'STEP 2: Check input test points for ES (Emergency Stop), GTC (Governor), and DFC (Door Fully Closed).',
      'STEP 3: Inspect Pit stop switch (PES), Buffer switches, and Car Top emergency stop button.',
      'STEP 4: Manually reset the overspeed governor switch lever located on governor frame in machine room / shaft top.'
    ],
    safetyPrecautions: [
      'Confirm shaft pit is clear of personnel before resetting safety circuit.'
    ]
  },
  {
    id: 'err-kne-0021',
    code: '0021',
    driveBrand: 'Kone',
    errorName: 'Kone LCE Door Closing Supervision Timeout',
    severity: 'high',
    symptoms: [
      'Door attempts to close 3 times, fails to lock, and re-opens fully',
      'Kone user interface displays 0021 error'
    ],
    possibleCauses: [
      'Mechanical obstruction in bottom sill groove (dirt, stone, debris)',
      'Light curtain transmitter/receiver misalignment',
      'AMD door drive belt slippage or motor encoder stall'
    ],
    stepByStepRemedy: [
      'STEP 1: Vacuum and scrape landing and car door bottom sill grooves thoroughly.',
      'STEP 2: Inspect LED indicators on light curtain receiver; red indicates optical obstruction or faulty diode channel.',
      'STEP 3: Perform door drive teach-in calibration run from LCE maintenance UI (Menu 5-1).'
    ],
    safetyPrecautions: [
      'Do not place hands between closing heavy fire doors without holding safety edge.'
    ],
    suggestedParts: ['32-Channel Smart Infrared Light Curtain', 'Kone AMD Door Drive Belt']
  },
  {
    id: 'err-sch-003',
    code: '003',
    driveBrand: 'Schindler',
    errorName: 'Schindler Bionic 5 Travel Time Exceeded',
    severity: 'critical',
    symptoms: [
      'Lift car stops between landings; controller locks out after failing to reach next floor within expected travel time'
    ],
    possibleCauses: [
      'Rope / belt slippage on drive traction sheave',
      'Optical floor position reader (PHS sensor) failure',
      'Mechanical safety gear dragged slightly against guide rail'
    ],
    stepByStepRemedy: [
      'STEP 1: Inspect synthetic traction belt (STM) condition for surface glaze or uneven tension.',
      'STEP 2: Clean PHS optical leveling sensor lenses and ensure shaft flag vanes are plumb.',
      'STEP 3: Execute travel time learning run from SMLCD menu 10.'
    ],
    safetyPrecautions: [
      'Wear safety harness when accessing car top in Schindler MRL shafts.'
    ]
  }
];

export const INITIAL_BUSINESS_ENQUIRIES: BusinessEnquiry[] = [];

export const INITIAL_FEEDBACKS: CustomerFeedback[] = [];

export const INITIAL_PARTS_REPLACEMENTS: PartReplacementRecord[] = [];

export const INITIAL_CLIENT_NOTIFICATIONS: ClientNotification[] = [];

export const INITIAL_APP_NOTIFICATIONS: AppNotification[] = [];
