import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import API handlers
import muxSignedUrlHandler from '../api/mux-signed-url.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());

// API routes
app.post('/api/mux-signed-url', async (req, res) => {
  await muxSignedUrlHandler(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});