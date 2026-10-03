import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// In-Memory Real-Time IoT State Map for Interactive Simulation
interface LiftTelemetryState {
  liftId: string;
  currentFloor: number;
  targetFloor: number;
  direction: 'UP' | 'DOWN' | 'IDLE';
  speedMps: number;
  maxSpeedMps: number;
  loadWeightKg: number;
  maxCapacityKg: number;
  loadPercentage: number;
  doorState: 'OPEN' | 'OPENING' | 'CLOSED' | 'CLOSING' | 'BLOCKED';
  doorCycleCount: number;
  motorTemperature: number;
  brakeCoilTemperature: number;
  vibrationRms: number;
  ardBatteryVoltage: number;
  ardBatteryHealthPercent: number;
  isPowerGridActive: boolean;
  isEmergencyStopActive: boolean;
  isLightCurtainBlocked: boolean;
  safetyCircuit: {
    governorTripped: boolean;
    carGateSwitch: boolean;
    landingDoorLocks: boolean;
    finalLimitSwitch: boolean;
    pitEmergencyStop: boolean;
    slackRopeSwitch: boolean;
  };
  totalTripsToday: number;
  energyKwhToday: number;
  lastUpdated: string;
}

const telemetryStateCache: Map<string, LiftTelemetryState> = new Map();

function getOrCreateTelemetryState(liftId: string): LiftTelemetryState {
  if (telemetryStateCache.has(liftId)) {
    return telemetryStateCache.get(liftId)!;
  }

  const initial: LiftTelemetryState = {
    liftId,
    currentFloor: 0,
    targetFloor: 0,
    direction: 'IDLE',
    speedMps: 0.0,
    maxSpeedMps: 1.5,
    loadWeightKg: 280,
    maxCapacityKg: 544,
    loadPercentage: 51,
    doorState: 'CLOSED',
    doorCycleCount: 48219,
    motorTemperature: 42.8,
    brakeCoilTemperature: 38.4,
    vibrationRms: 0.85,
    ardBatteryVoltage: 52.6,
    ardBatteryHealthPercent: 96,
    isPowerGridActive: true,
    isEmergencyStopActive: false,
    isLightCurtainBlocked: false,
    safetyCircuit: {
      governorTripped: false,
      carGateSwitch: true,
      landingDoorLocks: true,
      finalLimitSwitch: true,
      pitEmergencyStop: false,
      slackRopeSwitch: true,
    },
    totalTripsToday: 342,
    energyKwhToday: 18.6,
    lastUpdated: new Date().toISOString(),
  };

  telemetryStateCache.set(liftId, initial);
  return initial;
}

// GET /api/telemetry/live/:liftId — Get Real-Time IoT Telemetry & Sensor Readings
router.get('/live/:liftId', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const liftId = req.params.liftId as string;
    const companyId = req.user!.companyId || 'comp-1';

    let lift: any = null;
    try {
      lift = await prisma.lift.findFirst({
        where: { id: liftId, companyId },
        include: { building: true, client: true },
      });
    } catch {
      lift = db.lifts.find((l) => l.id === liftId);
    }

    const state = getOrCreateTelemetryState(liftId);

    // Apply subtle realistic micro-fluctuations
    if (state.direction === 'IDLE' && !state.isEmergencyStopActive) {
      state.vibrationRms = Number((0.6 + Math.random() * 0.3).toFixed(2));
      state.motorTemperature = Number((41.5 + Math.random() * 1.5).toFixed(1));
    }

    res.json({
      success: true,
      data: {
        lift: {
          id: liftId,
          permanentLiftId: lift?.permanentLiftId || 'WPS-PUN-000123',
          brand: lift?.brand || 'WEPSUN Elevators',
          model: lift?.model || 'Zenith-V4 PMSM Gearless',
          buildingName: lift?.building?.name || 'Greenwood Heights CHS',
          floors: lift?.floors || 'G + 14 Floors',
          stops: lift?.stops || 15,
          speedMps: lift?.speedMps || 1.5,
          capacityKg: lift?.capacityKg || 544,
          controller: lift?.controllerBrand || 'Monarch NICE 3000+ Integrated Vector',
          doorOperator: lift?.doorOperator || 'Fermator VVVF4+ 2-Panel Center Opening',
        },
        telemetry: state,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching telemetry', code: 'TELEMETRY_ERROR' });
  }
});

// POST /api/telemetry/dispatch-call — Interactive Floor Landing Call Dispatch
router.post('/dispatch-call', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { liftId, targetFloor, loadWeightKg } = req.body;
    if (targetFloor === undefined || targetFloor === null) {
      res.status(400).json({ success: false, message: 'Target floor is required.' });
      return;
    }

    const state = getOrCreateTelemetryState(liftId);
    if (state.isEmergencyStopActive) {
      res.status(400).json({ success: false, message: 'Cannot dispatch call: Emergency Stop is engaged.' });
      return;
    }

    state.targetFloor = Number(targetFloor);
    if (loadWeightKg !== undefined) {
      state.loadWeightKg = Number(loadWeightKg);
      state.loadPercentage = Math.round((state.loadWeightKg / state.maxCapacityKg) * 100);
    }

    if (state.targetFloor > state.currentFloor) {
      state.direction = 'UP';
      state.speedMps = state.maxSpeedMps;
      state.vibrationRms = 1.25;
      state.doorState = 'CLOSED';
    } else if (state.targetFloor < state.currentFloor) {
      state.direction = 'DOWN';
      state.speedMps = state.maxSpeedMps;
      state.vibrationRms = 1.15;
      state.doorState = 'CLOSED';
    } else {
      state.direction = 'IDLE';
      state.speedMps = 0.0;
      state.doorState = 'OPEN';
    }

    state.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      data: state,
      message: `Car dispatched to Floor ${targetFloor}. Direction: ${state.direction}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to dispatch call', code: 'DISPATCH_ERROR' });
  }
});

// POST /api/telemetry/update-position — Updates live car floor position as it travels
router.post('/update-position', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { liftId, floor, doorState, speedMps } = req.body;
    const state = getOrCreateTelemetryState(liftId);

    if (floor !== undefined) state.currentFloor = Number(floor);
    if (doorState !== undefined) state.doorState = doorState;
    if (speedMps !== undefined) state.speedMps = Number(speedMps);

    if (state.currentFloor === state.targetFloor) {
      state.direction = 'IDLE';
      state.speedMps = 0.0;
      state.vibrationRms = 0.75;
      state.totalTripsToday += 1;
      state.energyKwhToday = Number((state.energyKwhToday + 0.12).toFixed(2));
    }

    state.lastUpdated = new Date().toISOString();
    res.json({ success: true, data: state });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating position' });
  }
});

// POST /api/telemetry/simulate-fault — Real-Time IoT Fault Injection & Safety Diagnostic
router.post('/simulate-fault', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { liftId, faultType } = req.body;
    const companyId = req.user!.companyId || 'comp-1';
    const state = getOrCreateTelemetryState(liftId);

    let eventDescription = '';

    switch (faultType) {
      case 'EMERGENCY_STOP':
        state.isEmergencyStopActive = true;
        state.speedMps = 0;
        state.direction = 'IDLE';
        state.safetyCircuit.pitEmergencyStop = true;
        eventDescription = 'Emergency Stop button engaged manually via IoT telemetry interface.';
        break;

      case 'POWER_OUTAGE_ARD':
        state.isPowerGridActive = false;
        state.direction = 'IDLE';
        state.speedMps = 0.3; // Low speed ARD rescue
        eventDescription = 'Mains power failure detected. Automatic Rescue Device (ARD) battery power engaged.';
        break;

      case 'DOOR_OBSTRUCTION':
        state.isLightCurtainBlocked = true;
        state.doorState = 'BLOCKED';
        eventDescription = 'Infrared light curtain obstruction detected. Reversing door motion.';
        break;

      case 'OVERLOAD':
        state.loadWeightKg = 620;
        state.loadPercentage = 114;
        state.doorState = 'OPEN';
        eventDescription = 'Cabin load exceeds 100% rated capacity (620kg / 544kg). Buzzer sounded.';
        break;

      case 'RESET_NORMAL':
        state.isEmergencyStopActive = false;
        state.isPowerGridActive = true;
        state.isLightCurtainBlocked = false;
        state.loadWeightKg = 280;
        state.loadPercentage = 51;
        state.doorState = 'CLOSED';
        state.safetyCircuit = {
          governorTripped: false,
          carGateSwitch: true,
          landingDoorLocks: true,
          finalLimitSwitch: true,
          pitEmergencyStop: false,
          slackRopeSwitch: true,
        };
        eventDescription = 'All safety circuits reset to normal operational parameters.';
        break;

      default:
        break;
    }

    state.lastUpdated = new Date().toISOString();

    // Log diagnostic event in database
    try {
      await prisma.auditLog.create({
        data: {
          companyId,
          entityType: 'Lift',
          entityId: liftId,
          action: 'STATUS_CHANGE',
          performedBy: req.user!.email || 'IoT Telemetry Monitor',
          userRole: req.user!.role,
          details: `[IoT Telemetry Event] ${faultType}: ${eventDescription}`,
        },
      });
    } catch {
      // Non-blocking
    }

    res.json({
      success: true,
      data: state,
      faultType,
      message: eventDescription,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to simulate fault', code: 'FAULT_ERROR' });
  }
});

export default router;
