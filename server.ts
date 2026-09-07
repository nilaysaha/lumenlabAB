import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { assetDb } from './server/assetDb.js';
import { buildFFmpegCommand, createRenderJob, getAllRenderJobs, getRenderJob } from './server/ffmpeg.js';
import { generateAutoCaptions, generateVideoStoryboard } from './server/geminiAi.js';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parsing
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // ================= API ROUTES =================

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: process.platform });
  });

  // System Hardware & Mac Diagnostics
  app.get('/api/system/hardware', (_req, res) => {
    const cpus = os.cpus();
    const isDarwin = process.platform === 'darwin';
    const isAppleSilicon = isDarwin && (process.arch === 'arm64' || (cpus[0] && cpus[0].model.includes('Apple')));

    res.json({
      platform: process.platform,
      arch: process.arch,
      osRelease: os.release(),
      isAppleSilicon,
      cpuModel: cpus[0]?.model || 'Multi-core Processor',
      cpuCores: cpus.length,
      totalMemoryGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1),
      freeMemoryGB: (os.freemem() / (1024 * 1024 * 1024)).toFixed(1),
      hardwareAcceleration: {
        supported: true,
        primaryEncoder: isAppleSilicon ? 'h264_videotoolbox (Apple M-Series Hardware Engine)' : 'libx264 / Intel QuickSync',
        hevcEncoder: isAppleSilicon ? 'hevc_videotoolbox' : 'libx265',
        proresEncoder: 'prores_ks (Apple ProRes 422 / 4444)',
        activeBackend: 'Native FFmpeg C/C++ Pipeline & Filter Complex',
      },
    });
  });

  // Storage Diagnostics & Database Stats
  app.get('/api/storage/stats', (_req, res) => {
    const stats = assetDb.getStorageStats();
    res.json(stats);
  });

  // Assets Management API
  app.get('/api/assets', (req, res) => {
    const { type, query, tag } = req.query as Record<string, string>;
    const assets = assetDb.getAllAssets({ type, query, tag });
    res.json({ success: true, count: assets.length, assets });
  });

  app.post('/api/assets', (req, res) => {
    try {
      const newAsset = assetDb.addAsset(req.body);
      res.status(201).json({ success: true, asset: newAsset });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/assets/:id', (req, res) => {
    const deleted = assetDb.deleteAsset(req.params.id);
    res.json({ success: deleted });
  });

  // Projects Management API
  app.get('/api/projects', (_req, res) => {
    const projects = assetDb.getAllProjects();
    res.json({ success: true, projects });
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = assetDb.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }
    res.json({ success: true, project });
  });

  app.post('/api/projects', (req, res) => {
    try {
      const saved = assetDb.saveProject(req.body);
      res.json({ success: true, project: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    const deleted = assetDb.deleteProject(req.params.id);
    res.json({ success: deleted });
  });

  // FFmpeg Compilation & Rendering API
  app.post('/api/ffmpeg/build-command', (req, res) => {
    try {
      const { project, settings, outputFilename } = req.body;
      const result = buildFFmpegCommand(project, settings, outputFilename || 'output.mp4');
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ffmpeg/render', (req, res) => {
    try {
      const { project, settings } = req.body;
      if (!project || !settings) {
        res.status(400).json({ success: false, error: 'Missing project or settings' });
        return;
      }
      const job = createRenderJob(project, settings);
      res.status(202).json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/ffmpeg/jobs', (_req, res) => {
    const jobs = getAllRenderJobs();
    res.json({ success: true, jobs });
  });

  app.get('/api/ffmpeg/jobs/:id', (req, res) => {
    const job = getRenderJob(req.params.id);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }
    res.json({ success: true, job });
  });

  // AI Studio Features (Gemini 3.8 Flash)
  app.post('/api/ai/captions', async (req, res) => {
    try {
      const { prompt, duration } = req.body;
      const captions = await generateAutoCaptions(prompt || 'Exciting travel and tech video', Number(duration) || 10);
      res.json({ success: true, captions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ai/storyboard', async (req, res) => {
    try {
      const { topic, style, targetDuration } = req.body;
      const storyboard = await generateVideoStoryboard(topic || 'Viral Tech Review', style || 'Fast Paced CapCut Style', Number(targetDuration) || 15);
      res.json({ success: true, storyboard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ================= VITE / STATIC SERVING =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 LumenLab Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();
