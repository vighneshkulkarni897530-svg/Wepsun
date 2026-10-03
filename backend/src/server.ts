import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { checkDatabaseConnection } from './lib/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for production hosting (Render, Railway, AWS, Vercel, Cloudflare, Fly.io, Nginx)
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin REST and API inspection
    crossOriginEmbedderPolicy: false,
  })
);

// Dynamic CORS Configuration supporting Localhost, Mobile (Capacitor/Cordova), and Live Cloud Domains
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim().toLowerCase())
  : [];

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://10.0.2.2:5000',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
];

const allAllowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, native Capacitor WebViews)
      if (!origin) {
        return callback(null, true);
      }

      const lowerOrigin = origin.toLowerCase().replace(/\/+$/, '');

      // Check explicit matches or wildcard '*'
      if (
        allAllowedOrigins.includes('*') ||
        allAllowedOrigins.includes(lowerOrigin) ||
        allAllowedOrigins.some((allowed) => allowed === lowerOrigin || (allowed.startsWith('*.') && lowerOrigin.endsWith(allowed.slice(2))))
      ) {
        return callback(null, true);
      }

      // Permissive in non-production or allow standard cloud domains
      if (
        process.env.NODE_ENV !== 'production' ||
        lowerOrigin.includes('localhost') ||
        lowerOrigin.includes('127.0.0.1') ||
        lowerOrigin.includes('192.168.') ||
        lowerOrigin.includes('10.0.') ||
        lowerOrigin.includes('vercel.app') ||
        lowerOrigin.includes('onrender.com') ||
        lowerOrigin.includes('netlify.app') ||
        lowerOrigin.includes('pages.dev') ||
        lowerOrigin.includes('wepsun.com')
      ) {
        return callback(null, true);
      }

      callback(null, true); // Gracefully allow to avoid blocking legitimate cross-origin web apps
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-company-id',
      'x-branch-id',
      'x-user-role',
      'x-user-id',
      'x-client-version',
      'x-requested-with',
    ],
  })
);

// Request Parsers with generous body limits for photos / signatures / reports
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Root Information Endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'WEPSUN Engineering Solution — Lift & Escalator Service SaaS API',
    status: 'ONLINE',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/health',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      companies: '/api/companies',
      lifts: '/api/lifts',
      complaints: '/api/complaints',
      workOrders: '/api/work-orders',
      inventory: '/api/inventory',
      amc: '/api/amc',
      quotations: '/api/quotations',
      invoices: '/api/invoices',
      technicians: '/api/technicians',
      serviceReports: '/api/service-reports',
      pm: '/api/pm',
      payments: '/api/payments',
      feedback: '/api/feedback',
      notifications: '/api/notifications',
      ai: '/api/ai',
      audit: '/api/audit',
      telemetry: '/api/telemetry',
    },
  });
});

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  const dbHealth = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    service: 'WEPSUN Lift Service & AMC SaaS REST API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    security: {
      auth: 'JWT (HS256) + Refresh Token Rotation',
      rbac: 'Enforced (7 Roles: Super Admin, Company Admin, Service Manager, Technician, Client, Accounts, Sales)',
      multiTenancy: 'Enforced (Server-Side)',
    },
    database: {
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      provider: 'postgresql',
    },
  });
});

// Register API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[WEPSUN API Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// Start Server explicitly on all interfaces (0.0.0.0) for phone/LAN access
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡ WEPSUN Backend API Server listening on port ${PORT} (host: ${HOST})`);
  console.log(`📡 Local Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📱 Wi-Fi LAN Health Check: http://192.168.1.9:${PORT}/api/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

export default app;
