import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Activity,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Thermometer,
  Layers,
  ArrowUp,
  ArrowDown,
  Power,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Cpu,
  Radio,
  BatteryCharging,
  Maximize2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Lift } from '../../types';

interface IoTLiftSimulationModalProps {
  lift: Lift | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IoTLiftSimulationModal: React.FC<IoTLiftSimulationModalProps> = ({
  lift,
  isOpen,
  onClose,
}) => {
  const [currentFloor, setCurrentFloor] = useState<number>(0);
  const [targetFloor, setTargetFloor] = useState<number>(0);
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'IDLE'>('IDLE');
  const [speedMps, setSpeedMps] = useState<number>(0.0);
  const [maxSpeed] = useState<number>(1.5);
  const [doorState, setDoorState] = useState<'OPEN' | 'OPENING' | 'CLOSED' | 'CLOSING' | 'BLOCKED'>('CLOSED');
  const [loadWeightKg, setLoadWeightKg] = useState<number>(280);
  const [maxCapacityKg] = useState<number>(lift?.capacityKg || 544);
  const [motorTemp, setMotorTemp] = useState<number>(42.5);
  const [vibrationRms, setVibrationRms] = useState<number>(0.82);
  const [ardVoltage, setArdVoltage] = useState<number>(52.6);
  const [isPowerGridActive, setIsPowerGridActive] = useState<boolean>(true);
  const [isEmergencyStop, setIsEmergencyStop] = useState<boolean>(false);
  const [isDoorObstruction, setIsDoorObstruction] = useState<boolean>(false);
  const [tripsToday, setTripsToday] = useState<number>(342);
  const [energyKwh, setEnergyKwh] = useState<number>(18.6);
  const [eventLogs, setEventLogs] = useState<string[]>([
    'IoT Gateway v4.2 Connected: Telemetry streaming active at 50Hz',
    'Safety interlock chain verified: All 6 points normal',
  ]);

  const totalFloors = 14; // G to 14
  const animationIntervalRef = useRef<any>(null);

  // Initialize from Backend Telemetry
  useEffect(() => {
    if (!isOpen || !lift) return;

    const fetchInitial = async () => {
      try {
        const res = await apiFetch<any>(`/telemetry/live/${lift.id}`);
        if (res?.data?.telemetry) {
          const t = res.data.telemetry;
          setCurrentFloor(t.currentFloor);
          setTargetFloor(t.targetFloor);
          setDirection(t.direction);
          setLoadWeightKg(t.loadWeightKg);
          setDoorState(t.doorState);
          setMotorTemp(t.motorTemperature);
          setVibrationRms(t.vibrationRms);
          setArdVoltage(t.ardBatteryVoltage);
          setIsPowerGridActive(t.isPowerGridActive);
          setIsEmergencyStop(t.isEmergencyStopActive);
          setTripsToday(t.totalTripsToday);
          setEnergyKwh(t.energyKwhToday);
        }
      } catch {
        // Fallback
      }
    };

    fetchInitial();
  }, [isOpen, lift]);

  // Motion Simulation Engine Loop
  useEffect(() => {
    if (!isOpen) return;

    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);

    animationIntervalRef.current = setInterval(() => {
      if (isEmergencyStop) {
        setSpeedMps(0);
        setDirection('IDLE');
        return;
      }

      if (currentFloor < targetFloor) {
        setDirection('UP');
        setSpeedMps((prev) => Math.min(maxSpeed, Number((prev + 0.3).toFixed(2))));
        setDoorState('CLOSED');
        setVibrationRms(Number((1.1 + Math.random() * 0.2).toFixed(2)));

        setCurrentFloor((prev) => {
          const next = Number((prev + 0.2).toFixed(2));
          if (next >= targetFloor) {
            handleArrival(targetFloor);
            return targetFloor;
          }
          return next;
        });
      } else if (currentFloor > targetFloor) {
        setDirection('DOWN');
        setSpeedMps((prev) => Math.min(maxSpeed, Number((prev + 0.3).toFixed(2))));
        setDoorState('CLOSED');
        setVibrationRms(Number((1.05 + Math.random() * 0.2).toFixed(2)));

        setCurrentFloor((prev) => {
          const next = Number((prev - 0.2).toFixed(2));
          if (next <= targetFloor) {
            handleArrival(targetFloor);
            return targetFloor;
          }
          return next;
        });
      } else {
        setDirection('IDLE');
        setSpeedMps((prev) => Math.max(0, Number((prev - 0.3).toFixed(2))));
        setVibrationRms(Number((0.65 + Math.random() * 0.15).toFixed(2)));
      }
    }, 150);

    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, [currentFloor, targetFloor, isEmergencyStop, maxSpeed, isOpen]);

  const handleArrival = (floor: number) => {
    setDirection('IDLE');
    setSpeedMps(0);
    setDoorState('OPENING');
    setTripsToday((p) => p + 1);
    setEnergyKwh((p) => Number((p + 0.08).toFixed(2)));
    addLog(`Car arrived at Floor ${floor}. Leveling accuracy: ±1.2mm. Doors opening.`);

    setTimeout(() => {
      setDoorState('OPEN');
      setTimeout(() => {
        if (!isDoorObstruction) {
          setDoorState('CLOSING');
          setTimeout(() => {
            setDoorState('CLOSED');
          }, 1200);
        }
      }, 2000);
    }, 1000);
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-IN');
    setEventLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 7)]);
  };

  // Dispatch Floor Call
  const handleFloorClick = async (floorNum: number) => {
    if (isEmergencyStop) {
      addLog('⚠️ Call Rejected: Emergency Stop is active.');
      return;
    }

    setTargetFloor(floorNum);
    addLog(`Landing call registered: Dispatching car to Floor ${floorNum}`);

    if (lift) {
      try {
        await apiFetch('/telemetry/dispatch-call', {
          method: 'POST',
          body: JSON.stringify({
            liftId: lift.id,
            targetFloor: floorNum,
            loadWeightKg,
          }),
        });
      } catch {
        // Safe fallback
      }
    }
  };

  // Fault Simulator Actions
  const handleTriggerFault = async (type: string) => {
    if (type === 'EMERGENCY_STOP') {
      setIsEmergencyStop(true);
      setSpeedMps(0);
      setDirection('IDLE');
      addLog('🚨 CRITICAL: Emergency Stop button activated! Mechanical safety brakes engaged.');
    } else if (type === 'POWER_OUTAGE') {
      setIsPowerGridActive(false);
      setArdVoltage(48.2);
      addLog('⚡ WARNING: 415V 3-Phase power grid fail. ARD Battery System running at 48.2V.');
    } else if (type === 'DOOR_OBSTRUCTION') {
      setIsDoorObstruction(true);
      setDoorState('BLOCKED');
      addLog('🛑 Obstruction sensor active: Light curtain beam broken. Doors reversed.');
    } else if (type === 'OVERLOAD') {
      setLoadWeightKg(620);
      setDoorState('OPEN');
      addLog('⚠️ OVERLOAD ALARM: 620 kg exceeds rated 544 kg limit. Motion interlocked.');
    } else if (type === 'RESET') {
      setIsEmergencyStop(false);
      setIsPowerGridActive(true);
      setIsDoorObstruction(false);
      setLoadWeightKg(280);
      setDoorState('CLOSED');
      setArdVoltage(52.6);
      addLog('✅ All safety interlocks restored to normal operation.');
    }

    if (lift) {
      try {
        await apiFetch('/telemetry/simulate-fault', {
          method: 'POST',
          body: JSON.stringify({
            liftId: lift.id,
            faultType: type === 'RESET' ? 'RESET_NORMAL' : type === 'POWER_OUTAGE' ? 'POWER_OUTAGE_ARD' : type,
          }),
        });
      } catch {
        // Safe
      }
    }
  };

  if (!isOpen || !lift) return null;

  const loadPercent = Math.min(125, Math.round((loadWeightKg / maxCapacityKg) * 100));
  const carHeightPercent = (currentFloor / totalFloors) * 100;
  const counterweightHeightPercent = 100 - carHeightPercent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-white font-sans">
      <div className="bg-[#071324] border border-cyan-500/30 rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 relative flex flex-col gap-4 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  IoT Smart Lift Telemetry & 3D Twin
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lift.buildingName} • Lift {lift.liftNumber} ({lift.brand} {lift.model})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Sampling:</span>
              <span className="text-cyan-300 font-bold">50 Hz</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Hoistway Simulation + Right Instrumentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* ------------------------------------------------------------- */}
          {/* LEFT: 3D ISOMETRIC ELEVATOR HOISTWAY SHAFT */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-inner min-h-[460px]">
            {/* Machine Room Header */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-dashed ${
                    direction !== 'IDLE' ? 'border-cyan-400 animate-spin' : 'border-slate-500'
                  }`}
                />
                <span className="font-bold text-slate-200">Machine Room Top</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold">PMSM Gearless 5.5kW</span>
            </div>

            {/* Shaft Interior with Guides, Counterweight, Car */}
            <div className="relative flex-1 my-3 bg-gradient-to-b from-slate-950 via-[#0b1b30] to-slate-950 rounded-xl border border-slate-800 p-2 flex justify-between overflow-hidden">
              {/* Floor Labels Column */}
              <div className="w-12 flex flex-col justify-between py-1 z-10 select-none">
                {[14, 12, 10, 8, 6, 4, 2, 0].map((fl) => (
                  <button
                    key={fl}
                    onClick={() => handleFloorClick(fl)}
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all flex items-center justify-between ${
                      Math.round(currentFloor) === fl
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : targetFloor === fl
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>F{fl === 0 ? 'G' : fl}</span>
                    {Math.round(currentFloor) === fl && <span className="w-1 h-1 rounded-full bg-slate-950" />}
                  </button>
                ))}
              </div>

              {/* Guide Rails Center Visual */}
              <div className="absolute inset-y-0 left-16 right-16 flex justify-between px-3 pointer-events-none opacity-20">
                <div className="w-1 bg-cyan-400 h-full" />
                <div className="w-1 bg-cyan-400 h-full" />
              </div>

              {/* Elevator Traveling Car */}
              <div
                style={{
                  bottom: `${Math.min(92, Math.max(2, carHeightPercent))}%`,
                  transition: 'bottom 150ms linear',
                }}
                className="absolute left-16 right-24 h-16 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-2 border-cyan-400 rounded-xl p-2 shadow-lg shadow-cyan-500/30 flex flex-col justify-between z-20"
              >
                {/* Car Roof & Fan Indicator */}
                <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300">
                  <span className="font-black">CAR #1</span>
                  <div className="flex items-center gap-1">
                    {direction === 'UP' && <ArrowUp className="w-3 h-3 text-emerald-400 animate-bounce" />}
                    {direction === 'DOWN' && <ArrowDown className="w-3 h-3 text-amber-400 animate-bounce" />}
                    {direction === 'IDLE' && <span className="text-slate-400">IDLE</span>}
                  </div>
                </div>

                {/* Animated VVVF Sliding Doors */}
                <div className="relative h-6 bg-slate-950 rounded border border-slate-600 overflow-hidden flex items-center justify-center">
                  <div
                    style={{
                      width: doorState === 'OPEN' ? '0%' : doorState === 'OPENING' ? '30%' : doorState === 'CLOSING' ? '80%' : '100%',
                      transition: 'width 800ms ease-in-out',
                    }}
                    className={`h-full bg-gradient-to-r from-slate-500 to-slate-400 flex items-center justify-center text-[8px] font-mono font-bold text-slate-900 ${
                      isDoorObstruction ? 'border-r-2 border-red-500' : ''
                    }`}
                  >
                    {doorState === 'OPEN' ? '' : doorState === 'BLOCKED' ? 'OBSTRUCT' : 'DOOR'}
                  </div>
                  {doorState === 'OPEN' && (
                    <span className="text-[9px] font-bold text-emerald-400 animate-pulse">DOOR OPEN</span>
                  )}
                </div>

                {/* Live Position Badge */}
                <div className="text-[8px] font-mono text-slate-400 flex justify-between">
                  <span>Fl: {currentFloor.toFixed(1)}</span>
                  <span>{speedMps.toFixed(1)} m/s</span>
                </div>
              </div>

              {/* Counterweight (Moves in opposite direction) */}
              <div
                style={{
                  bottom: `${Math.min(92, Math.max(2, counterweightHeightPercent))}%`,
                  transition: 'bottom 150ms linear',
                }}
                className="absolute right-4 w-14 h-12 bg-slate-800 border border-slate-600 rounded-lg p-1 flex flex-col items-center justify-center text-[8px] font-mono text-slate-400 shadow z-20"
              >
                <Layers className="w-3 h-3 text-slate-400 mb-0.5" />
                <span>CWT 720kg</span>
              </div>
            </div>

            {/* Pit Level Bottom */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Elevator Pit (Buffer Spring)</span>
              <span className="text-emerald-400 font-bold">Limit Switch OK</span>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT: INSTRUMENT CLUSTER GAUGES & FAULT INJECTION */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {/* Top 4 Telemetry Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Velocity Gauge */}
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                  <span>Velocity</span>
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="my-1 text-center">
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    {speedMps.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">m/s</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${(speedMps / maxSpeed) * 100}%` }}
                    className="bg-cyan-400 h-full transition-all"
                  />
                </div>
              </div>

              {/* Load Meter */}
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                  <span>Load (544kg)</span>
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="my-1 text-center">
                  <span className={`text-2xl font-black font-mono ${loadPercent > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {loadWeightKg}
                  </span>
                  <span className="text-[10px] text-slate-400 block">kg ({loadPercent}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, loadPercent)}%` }}
                    className={`h-full transition-all ${loadPercent > 100 ? 'bg-red-500' : 'bg-emerald-400'}`}
                  />
                </div>
              </div>

              {/* Motor Thermal */}
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                  <span>Motor Temp</span>
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="my-1 text-center">
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {motorTemp.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">°C (Normal)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div style={{ width: `${(motorTemp / 80) * 100}%` }} className="bg-amber-400 h-full transition-all" />
                </div>
              </div>

              {/* Vibration RMS */}
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                  <span>Vibration</span>
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="my-1 text-center">
                  <span className="text-2xl font-black font-mono text-purple-400">
                    {vibrationRms.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">mm/s RMS</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div style={{ width: `${(vibrationRms / 3) * 100}%` }} className="bg-purple-400 h-full transition-all" />
                </div>
              </div>
            </div>

            {/* Interactive Landing Call Pushbuttons (0 to 14) */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Interactive Floor Landing Call Dispatch</span>
                <span className="text-[10px] font-mono text-cyan-400">Click any floor to dispatch</span>
              </div>

              <div className="grid grid-cols-8 sm:grid-cols-15 gap-1.5">
                {Array.from({ length: 15 }, (_, i) => i).map((fl) => {
                  const isCurrent = Math.round(currentFloor) === fl;
                  const isTarget = targetFloor === fl;

                  return (
                    <button
                      key={fl}
                      onClick={() => handleFloorClick(fl)}
                      className={`h-9 rounded-xl font-mono text-xs font-bold transition-all border ${
                        isCurrent
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-black ring-2 ring-cyan-400/40'
                          : isTarget
                          ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {fl === 0 ? 'G' : fl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Safety Interlock Circuit Matrix */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-200 block">6-Point Safety Circuit Interlock Matrix</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Over-Speed Governor</span>
                  <span className="text-emerald-400 font-bold">NORMAL</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Car Gate Switch</span>
                  <span className={doorState === 'CLOSED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {doorState === 'CLOSED' ? 'CLOSED' : 'OPEN'}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Landing Door Locks</span>
                  <span className="text-emerald-400 font-bold">SECURED</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Final Limits (Top/Pit)</span>
                  <span className="text-emerald-400 font-bold">PASSED</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Pit Emergency Stop</span>
                  <span className={isEmergencyStop ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {isEmergencyStop ? 'TRIPPED' : 'CLEAR'}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Slack Rope Sensor</span>
                  <span className="text-emerald-400 font-bold">TENSION OK</span>
                </div>
              </div>
            </div>

            {/* Real-time Fault Injection Simulation Bar */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-200 block">Real-Time IoT Fault Simulator & Diagnostics</span>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => handleTriggerFault('EMERGENCY_STOP')}
                  className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 transition-all flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>E-Stop</span>
                </button>

                <button
                  onClick={() => handleTriggerFault('POWER_OUTAGE')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/40 transition-all flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Power Cut (ARD)</span>
                </button>

                <button
                  onClick={() => handleTriggerFault('DOOR_OBSTRUCTION')}
                  className="px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/40 transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Door Obstruction</span>
                </button>

                <button
                  onClick={() => handleTriggerFault('OVERLOAD')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/40 transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Overload</span>
                </button>

                <button
                  onClick={() => handleTriggerFault('RESET')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black transition-all flex items-center gap-1.5 ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Event Stream Box */}
            <div className="bg-black/50 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] text-slate-400 space-y-1 max-h-24 overflow-y-auto">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">Live Telemetry Event Log</div>
              {eventLogs.map((log, idx) => (
                <p key={idx} className="leading-snug">
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
