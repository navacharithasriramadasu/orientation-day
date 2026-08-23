import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import candidateRoutes from './routes/candidateRoutes';
import importRoutes from './routes/importRoutes';
import adminCandidatesRoutes from './routes/adminCandidatesRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import eventRoutes from './routes/eventRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();

// Enable CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check & Root Endpoints
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    system: 'Orientation Day - 2026 Batch System',
    timestamp: new Date().toISOString(),
    api: '/api',
  });
});

// Direct APK Download Endpoint for mobile devices
app.get(['/download/apk', '/api/download/apk'], (req, res) => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'GraduationQR-Scanner.apk'),
    path.resolve(process.cwd(), '../GraduationQR-Scanner.apk'),
    path.resolve(__dirname, '../../GraduationQR-Scanner.apk'),
    path.resolve(__dirname, '../../../GraduationQR-Scanner.apk'),
    path.resolve(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk'),
    'C:\\Users\\Amear\\Downloads\\GraduationQR-Scanner.apk',
  ];

  for (const apkPath of possiblePaths) {
    if (require('fs').existsSync(apkPath)) {
      return res.download(apkPath, 'GraduationQR-Scanner.apk');
    }
  }

  res.status(404).json({ error: 'APK file not found. Please build it first using npm run build:apk' });
});

// API Routes
app.use('/api/auth', authRoutes);

app.use('/api/candidate', candidateRoutes);
app.use('/api/candidates', candidateRoutes);

app.use('/api/import', importRoutes);
app.use('/api/admin/import', importRoutes);

app.use('/api/admin/candidates', adminCandidatesRoutes);

app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', attendanceRoutes);

app.use('/api/events', eventRoutes);
app.use('/api/admin/events', eventRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;
