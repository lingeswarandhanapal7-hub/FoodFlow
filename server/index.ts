import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDb } from './db.js';

import { authRouter } from './routes/auth.js';
import { otpRouter } from './routes/otp.js';
import { menuRouter } from './routes/menu.js';
import { wasteLogsRouter } from './routes/wasteLogs.js';
import { listingsRouter } from './routes/listings.js';
import { ordersRouter } from './routes/orders.js';
import { donationsRouter } from './routes/donations.js';
import { csrReceiptsRouter } from './routes/csrReceipts.js';
import { notificationsRouter } from './routes/notifications.js';
import { aiRouter } from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security HTTP Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS & Body Parser
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 3. Global API Rate Limiting (200 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

app.use('/api', globalLimiter);

// Initialize Database & Seed Data
initDb();

// Register API Routes
app.use('/api', authRouter);
app.use('/api', otpRouter);
app.use('/api', menuRouter);
app.use('/api', wasteLogsRouter);
app.use('/api', listingsRouter);
app.use('/api', ordersRouter);
app.use('/api', donationsRouter);
app.use('/api', csrReceiptsRouter);
app.use('/api', notificationsRouter);
app.use('/api', aiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'FoodFlow Backend API', 
    security: 'Hardened (Helmet + RateLimiting + Google Auth + OTP Verification)',
    timestamp: new Date().toISOString() 
  });
});

// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[FOODFLOW SERVER ERROR]:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Serve frontend build static files in production
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  🚀 FoodFlow Backend Server is running!          `);
    console.log(`  🛡️ Security: Helmet & Rate-Limiter Enabled      `);
    console.log(`  📡 API Endpoint: http://localhost:${PORT}/api    `);
    console.log(`==================================================`);
  });
}
