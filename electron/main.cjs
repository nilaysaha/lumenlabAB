const { app, BrowserWindow, ipcMain, dialog, Menu, shell, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

let mainWindow;

// User Data Storage directory: ~/Library/Application Support/LumenLabStudio on macOS
const getAppDataDir = () => {
  const base = app.getPath('userData');
  const projectDir = path.join(base, 'projects');
  const assetsDir = path.join(base, 'vault_assets');
  const exportsDir = path.join(base, 'exports');

  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  return { base, projectDir, assetsDir, exportsDir };
};

// Robust helper to locate the production index.html across development, unpacked, and packaged environments
function findIndexHtml() {
  const candidates = [
    path.join(__dirname, '../dist/index.html'),
    path.join(__dirname, 'dist/index.html'),
    path.join(__dirname, 'index.html'),
    path.join(app.getAppPath(), 'dist/index.html'),
    path.join(app.getAppPath(), 'index.html'),
    path.join(process.resourcesPath, 'app/dist/index.html'),
    path.join(process.resourcesPath, 'dist/index.html'),
    path.join(process.cwd(), 'dist/index.html'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(__dirname, '../dist/index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0F1115',
    show: false, // Show gracefully once ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false, // Allows local media protocol playback and file loading
      allowRunningInsecureContent: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  const prodIndex = findIndexHtml();

  // Reveal window smoothly when content is ready to prevent black flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development' && !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(prodIndex).catch((err) => {
        console.error('Failed to load local index.html in dev:', err);
      });
    });
  } else {
    mainWindow.loadFile(prodIndex).catch((err) => {
      console.error('Failed to load local index.html in prod, retrying with loadURL:', err);
      mainWindow.loadURL(`file://${prodIndex}`).catch((e) => {
        console.error('Failed fallback URL load:', e);
      });
    });
  }

  // Handle render crashes or loading failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[LumenLab] Failed to load URL (${errorCode}: ${errorDescription}): ${validatedURL}`);
    // If dev server failed to load, automatically switch to compiled dist bundle
    if (validatedURL.includes('localhost:3000')) {
      const fallbackFile = findIndexHtml();
      if (fs.existsSync(fallbackFile)) {
        mainWindow.loadFile(fallbackFile);
      }
    }
  });

  createNativeMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createNativeMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: 'LumenLab Studio',
      submenu: [
        { role: 'about', label: 'About LumenLab Studio' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,', click: () => mainWindow?.webContents.send('menu:action', 'preferences') },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:action', 'new-project') },
        { label: 'Open Project...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu:action', 'open-project') },
        { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu:action', 'save-project') },
        { type: 'separator' },
        { label: 'Import Media...', accelerator: 'CmdOrCtrl+I', click: () => mainWindow?.webContents.send('menu:action', 'import-media') },
        { label: 'Export Video (FFmpeg)...', accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('menu:action', 'export-video') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow?.webContents.send('menu:action', 'undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => mainWindow?.webContents.send('menu:action', 'redo') },
        { type: 'separator' },
        { label: 'Split Clip at Playhead', accelerator: 'CmdOrCtrl+B', click: () => mainWindow?.webContents.send('menu:action', 'split-clip') },
        { label: 'Delete Selected', accelerator: 'Backspace', click: () => mainWindow?.webContents.send('menu:action', 'delete-clip') },
        { label: 'Duplicate Clip', accelerator: 'CmdOrCtrl+D', click: () => mainWindow?.webContents.send('menu:action', 'duplicate-clip') },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Timeline',
      submenu: [
        { label: 'Play / Pause', accelerator: 'Space', click: () => mainWindow?.webContents.send('menu:action', 'toggle-playback') },
        { label: 'Step 1 Frame Back', accelerator: 'Left', click: () => mainWindow?.webContents.send('menu:action', 'step-back') },
        { label: 'Step 1 Frame Forward', accelerator: 'Right', click: () => mainWindow?.webContents.send('menu:action', 'step-forward') },
        { label: 'Go to Start', accelerator: 'Home', click: () => mainWindow?.webContents.send('menu:action', 'seek-start') },
        { label: 'Go to End', accelerator: 'End', click: () => mainWindow?.webContents.send('menu:action', 'seek-end') },
        { type: 'separator' },
        { label: 'Toggle Snapping', accelerator: 'N', click: () => mainWindow?.webContents.send('menu:action', 'toggle-snap') },
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In Timeline', accelerator: 'CmdOrCtrl+=', click: () => mainWindow?.webContents.send('menu:action', 'zoom-in') },
        { label: 'Zoom Out Timeline', accelerator: 'CmdOrCtrl+-', click: () => mainWindow?.webContents.send('menu:action', 'zoom-out') },
        { label: 'Zoom to Fit', accelerator: 'Shift+Z', click: () => mainWindow?.webContents.send('menu:action', 'zoom-fit') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('dialog:openFile', async (_event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'aac', 'png', 'jpg', 'jpeg', 'svg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    ...options,
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (_event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Video Destination',
    defaultPath: 'LumenLab_Export.mp4',
    filters: [
      { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
      { name: 'Apple ProRes (*.mov)', extensions: ['mov'] },
      { name: 'WebM Video (*.webm)', extensions: ['webm'] },
      { name: 'GIF Animation (*.gif)', extensions: ['gif'] }
    ],
    ...options,
  });
  return result;
});

ipcMain.handle('app:revealInFinder', (_event, targetPath) => {
  if (targetPath && fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath);
    return true;
  }
  const { exportsDir } = getAppDataDir();
  shell.openPath(exportsDir);
  return true;
});

ipcMain.handle('storage:getStats', () => {
  const { projectDir, assetsDir, exportsDir } = getAppDataDir();
  let totalBytes = 0;

  const countDir = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(dir, f));
        totalBytes += stat.size;
      } catch (e) {}
    }
    return files.length;
  };

  const projectCount = countDir(projectDir);
  const assetCount = countDir(assetsDir);
  const exportCount = countDir(exportsDir);

  return {
    isDesktop: true,
    platform: process.platform,
    arch: process.arch,
    location: path.join(app.getPath('userData')),
    totalProjects: projectCount,
    totalAssets: assetCount,
    totalExports: exportCount,
    totalSizeBytes: totalBytes,
    totalSizeMB: (totalBytes / (1024 * 1024)).toFixed(2),
    offlineStatus: 'Secure Local File Storage Active',
  };
});

ipcMain.handle('storage:saveProject', (_event, project) => {
  const { projectDir } = getAppDataDir();
  const filePath = path.join(projectDir, `${project.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
  return { success: true, path: filePath };
});

ipcMain.handle('storage:loadProject', (_event, projectId) => {
  const { projectDir } = getAppDataDir();
  const filePath = path.join(projectDir, `${projectId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
});

ipcMain.handle('storage:listProjects', () => {
  const { projectDir } = getAppDataDir();
  if (!fs.existsSync(projectDir)) return [];
  const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.json'));
  const projects = [];
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(projectDir, f), 'utf-8'));
      projects.push(data);
    } catch (e) {}
  }
  return projects;
});

ipcMain.handle('storage:importMedia', (_event, filePaths = []) => {
  const { assetsDir } = getAppDataDir();
  const importedAssets = [];

  for (const src of filePaths) {
    try {
      if (!fs.existsSync(src)) continue;
      const fileName = `${Date.now()}_${path.basename(src)}`;
      const dest = path.join(assetsDir, fileName);
      fs.copyFileSync(src, dest);
      importedAssets.push({
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: path.basename(src),
        path: dest,
        url: `file://${dest}`,
        size: fs.statSync(dest).size,
      });
    } catch (e) {
      console.error('Failed to import asset:', e);
    }
  }

  return importedAssets;
});

ipcMain.handle('ffmpeg:execute', (_event, { args = [], jobId = 'default' }) => {
  return new Promise((resolve) => {
    try {
      const ffmpegProcess = spawn('ffmpeg', args);
      let errorLog = '';

      ffmpegProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorLog += text;
        mainWindow?.webContents.send('ffmpeg:progress', {
          jobId,
          log: text,
        });
      });

      ffmpegProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          errorLog: code !== 0 ? errorLog : undefined,
        });
      });

      ffmpegProcess.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
          errorLog,
        });
      });
    } catch (err) {
      resolve({
        success: false,
        error: err.message,
      });
    }
  });
});

ipcMain.handle('app:getSystemInfo', () => {
  const cpus = os.cpus();
  const isAppleSilicon = process.platform === 'darwin' && (process.arch === 'arm64' || (cpus[0] && cpus[0].model.includes('Apple')));

  return {
    os: `${process.platform} ${os.release()}`,
    arch: process.arch,
    isAppleSilicon,
    hardwareEncoder: isAppleSilicon ? 'Apple VideoToolbox (M-Series Hardware Accelerated)' : 'Intel QuickSync / Software libx264',
    cpuModel: cpus[0] ? cpus[0].model : 'Multi-Core CPU',
    cpuCores: cpus.length,
    totalMemoryGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1),
    freeMemoryGB: (os.freemem() / (1024 * 1024 * 1024)).toFixed(1),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
  };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
