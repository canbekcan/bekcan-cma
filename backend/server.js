/**
 * File: backend/server.js
 * Description: Core entry point for the backend Express server. Sets up security, rate limits, static directories, sub-routes, and starts listening.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Database pool and migration checker
const { checkAndMigrateDb } = require('./config/db');

// Sub-routers
const authRouter = require('./routes/auth');
const conferencesRouter = require('./routes/conferences');
const adminRouter = require('./routes/admin');

const app = express();
app.set('trust proxy', 1); // Trust Nginx reverse proxy

const port = process.env.PORT || 4000;

// ==============================================
// MIDDLEWARES & SECURITY
// ==============================================

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "http://localhost:4000", "https://conf.bekcan.com"]
  }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests from this IP' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter);

app.use(cors());
app.use(express.json());

// ==============================================
// ROUTERS & API MOUNTING
// ==============================================

app.use('/api/auth', authRouter);
app.use('/api/conferences', conferencesRouter);
app.use('/api/admin', adminRouter);

// ==============================================
// STATIC FILES & PAGE ROUTINGS
// ==============================================

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/public')));
// Serve admin panel static files under /admin
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// Fallback routing for API Docs
app.get(/^\/api-docs/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/api-docs.html'));
});

// Fallback routing for Admin UI
app.get(/^\/admin/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// Explicit routing for Root (Landing Page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Subdomain/Path based UI for specific conference (e.g. /bekcan2026)
app.get('/:slug', (req, res, next) => {
  const { slug } = req.params;
  if (slug.includes('.') || ['api', 'admin', 'api-docs'].includes(slug)) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/public/schedule.html'));
});

// ==============================================
// INITIALIZATION & STARTUP
// ==============================================

// Run DB check & migration
checkAndMigrateDb();

app.listen(port, () => {
  console.log(`[Server] Backend server running on http://localhost:${port}`);
});
