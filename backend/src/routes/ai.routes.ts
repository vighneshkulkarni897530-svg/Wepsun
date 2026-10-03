import { Router, Request, Response } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

// Get knowledge base of error codes
router.get('/error-codes', (_req: Request, res: Response) => {
  res.json({ success: true, count: db.aiErrorCodes.length, data: db.aiErrorCodes });
});

// AI Fault Diagnostic Root Cause Analysis
router.post('/diagnose', (req: Request, res: Response) => {
  const { symptom, driveBrand, errorCode } = req.body;

  if (!symptom && !errorCode) {
    res.status(400).json({ success: false, error: 'Please provide a fault symptom description or error code.' });
    return;
  }

  // Exact error code match in knowledge base
  if (errorCode) {
    const matched = db.aiErrorCodes.find(
      (c) => c.code.toLowerCase() === errorCode.toLowerCase() && (!driveBrand || c.driveBrand === driveBrand)
    );
    if (matched) {
      res.json({
        success: true,
        source: 'knowledge_base',
        data: matched,
      });
      return;
    }
  }

  // Generative elevator fault reasoning
  res.json({
    success: true,
    source: 'ai_inference_engine',
    data: {
      symptom: symptom || errorCode,
      probableCauses: [
        'Landing door interlock mechanical switch contact bounce or oxidation',
        'Safety loop 110V DC circuit intermittent drop due to optical light curtain misalignment',
        'VVVF inverter DC bus voltage ripple exceeding permissible tolerance',
      ],
      recommendedSteps: [
        '1. Measure safety circuit 110V DC potential across landing door beaks.',
        '2. Inspect Fermator / Selcom door clutch skate clearance (must maintain 6-8mm clearance).',
        '3. Check main 415V 3-phase line balance and inverter heat-sink cooling fan operation.',
      ],
      safetyWarning: 'Always engage car top inspection STOP button and lockout 415V breaker before touching door motor contacts.',
      suggestedSpare: 'Landing Door Lock Interlock Switch Beak (WEP-SW-LCK102)',
      confidenceScore: 0.94,
    },
  });
});

export default router;
