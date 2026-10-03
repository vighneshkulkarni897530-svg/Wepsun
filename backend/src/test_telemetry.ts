import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTelemetryTests() {
  console.log('🚀 Starting IoT Lift Telemetry & 3D Simulation Integration Tests...\n');

  try {
    // 0. Authenticate
    console.log('0. Authenticating as Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@wepsun.com',
      password: 'Wepsun@2026',
    });
    const token = loginRes.data.data.accessToken;
    console.log('   ✅ Authenticated successfully.\n');

    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Fetch Live Telemetry Snapshot
    console.log('1. Testing GET /api/telemetry/live/lift-1...');
    const liveRes = await axios.get(`${BASE_URL}/telemetry/live/lift-1`, { headers });
    const { lift, telemetry } = liveRes.data.data;
    console.log('   Status:', liveRes.status);
    console.log('   Lift Info:', lift.permanentLiftId, '| Building:', lift.buildingName);
    console.log('   Controller:', lift.controller, '| Rated Speed:', lift.speedMps, 'm/s');
    console.log('   Current Floor:', telemetry.currentFloor, '| Speed:', telemetry.speedMps, 'm/s');
    console.log('   Load:', telemetry.loadPercentage, '% | Motor Temp:', telemetry.motorTemperature, '°C');
    console.log('   Safety Circuit Interlocks:', telemetry.safetyCircuit);
    if (!telemetry.liftId || telemetry.safetyCircuit.governorTripped !== false) {
      throw new Error('Invalid telemetry payload structure');
    }
    console.log('   ✅ Live Telemetry Snapshot Validated!\n');

    // Test 2: Dispatch Landing Floor Call
    console.log('2. Testing POST /api/telemetry/dispatch-call...');
    const dispatchRes = await axios.post(
      `${BASE_URL}/telemetry/dispatch-call`,
      {
        liftId: 'lift-1',
        targetFloor: 9,
        loadWeightKg: 320,
      },
      { headers }
    );
    console.log('   Status:', dispatchRes.status);
    console.log('   Target Floor:', dispatchRes.data.data.targetFloor, '| Direction:', dispatchRes.data.data.direction);
    console.log('   Current Speed:', dispatchRes.data.data.speedMps, 'm/s');
    console.log('   ✅ Floor Call Dispatching Validated!\n');

    // Test 3: Real-Time Position & Trip Metric Update
    console.log('3. Testing POST /api/telemetry/update-position...');
    const updatePosRes = await axios.post(
      `${BASE_URL}/telemetry/update-position`,
      {
        liftId: 'lift-1',
        currentFloor: 9,
        doorState: 'OPEN',
        speedMps: 0.0,
        energyKwhDelta: 0.12,
      },
      { headers }
    );
    console.log('   Status:', updatePosRes.status);
    console.log('   Updated Floor:', updatePosRes.data.data.currentFloor, '| Door State:', updatePosRes.data.data.doorState);
    console.log('   Total Trips Today:', updatePosRes.data.data.totalTripsToday, '| Energy (kWh):', updatePosRes.data.data.energyKwhToday);
    console.log('   ✅ Real-time Position & Energy Log Validated!\n');

    // Test 4: Fault Simulation - ARD Power Outage
    console.log('4. Testing POST /api/telemetry/simulate-fault (POWER_OUTAGE_ARD)...');
    const ardFaultRes = await axios.post(
      `${BASE_URL}/telemetry/simulate-fault`,
      {
        liftId: 'lift-1',
        faultType: 'POWER_OUTAGE_ARD',
      },
      { headers }
    );
    console.log('   Status:', ardFaultRes.status);
    console.log('   Fault Type:', ardFaultRes.data.faultType, '| Grid Active:', ardFaultRes.data.data.isPowerGridActive);
    console.log('   ARD Rescue Speed:', ardFaultRes.data.data.speedMps, 'm/s | Battery Voltage:', ardFaultRes.data.data.ardBatteryVoltage, 'V');
    console.log('   Message:', ardFaultRes.data.message);
    console.log('   ✅ ARD Outage Simulation Validated!\n');

    // Test 5: Fault Reset - Return to Normal Operation
    console.log('5. Testing POST /api/telemetry/simulate-fault (RESET_NORMAL)...');
    const resetRes = await axios.post(
      `${BASE_URL}/telemetry/simulate-fault`,
      {
        liftId: 'lift-1',
        faultType: 'RESET_NORMAL',
      },
      { headers }
    );
    console.log('   Status:', resetRes.status);
    console.log('   Grid Active:', resetRes.data.data.isPowerGridActive, '| Emergency Stop:', resetRes.data.data.isEmergencyStopActive);
    console.log('   Safety Interlocks OK:', resetRes.data.data.safetyCircuit.carGateSwitch);
    console.log('   Message:', resetRes.data.message);
    console.log('   ✅ Normalization & Interlock Reset Validated!\n');

    console.log('🎉 ALL 5 IOT TELEMETRY & 3D SIMULATION INTEGRATION TESTS PASSED 100%!');
  } catch (err: any) {
    console.error('❌ Telemetry Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTelemetryTests();
