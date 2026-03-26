import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import routes from './src/routes/index.js';
import errorHandler from './src/middlewares/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use((req, res, next) => {
  console.log(`[SERVER DEBUG] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3000;

// ---- Security Middlewares ----
app.use(helmet());
app.use(cors());

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// ---- Body Parsers ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- HTTP Logging ----
app.use(morgan('dev'));

// ---- Static Files (uploaded images) ----
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

// ---- API Routes ----
app.use('/api', routes);

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Salon Admin API is running',
    timestamp: new Date().toISOString(),
  });
});

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ---- Global Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`\n🚀 Salon Admin API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
