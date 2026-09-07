export interface AssetRecord {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'sfx' | 'sticker';
  uri: string;
  localPath?: string;
  duration: number; // in seconds
  width?: number;
  height?: number;
  fps?: number;
  sizeBytes?: number;
  mimeType?: string;
  codec?: string;
  audioChannels?: number;
  sampleRate?: number;
  thumbnail?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface KeyframePoint {
  time: number; // relative to clip start (seconds)
  value: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface ClipTransform {
  x: number; // -100 to 100 (% offset from center)
  y: number;
  scale: number; // 0.1 to 5.0 (default 1.0)
  rotation: number; // -360 to 360 degrees
  opacity: number; // 0 to 1
  blendMode?: 'normal' | 'screen' | 'multiply' | 'overlay' | 'add' | 'darken' | 'lighten';
}

export interface ClipColorGrading {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -100 to 100 (Kelvin shift)
  tint: number; // -100 to 100 (green/magenta)
  vignette: number; // 0 to 100
  sharpen: number; // 0 to 100
  filterLut?: string; // 'cinematic', 'vintage', 'cyberpunk', 'teal-orange', 'bw', 'vhs'
}

export interface ClipChromaKey {
  enabled: boolean;
  color: string; // hex #00FF00
  similarity: number; // 0 to 100
  smoothness: number; // 0 to 100
  spillReduction: number; // 0 to 100
}

export interface TextClipData {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  animation?: 'none' | 'fade' | 'typewriter' | 'bounce' | 'slide-up' | 'glow-pulse';
  alignment: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  assetId?: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'sfx' | 'sticker' | 'adjustment';
  src: string;
  thumbnail?: string;
  
  // Timeline placement
  startTime: number; // start on timeline in seconds
  duration: number; // duration on timeline in seconds
  trimStart: number; // trim from asset start (seconds)
  trimEnd: number; // trim from asset end (seconds)
  
  // Audio & Speed
  volume: number; // 0 to 2 (1 = 100%)
  speed: number; // 0.1 to 10 (1 = normal)
  muted: boolean;
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  
  // Transform & Visuals
  transform: ClipTransform;
  color: ClipColorGrading;
  chromaKey?: ClipChromaKey;
  textData?: TextClipData;
  
  // Keyframes
  keyframes?: {
    opacity?: KeyframePoint[];
    scale?: KeyframePoint[];
    positionX?: KeyframePoint[];
    positionY?: KeyframePoint[];
    volume?: KeyframePoint[];
  };
  
  // Transitions
  transitionIn?: {
    type: 'fade' | 'wipe-left' | 'wipe-right' | 'zoom-in' | 'zoom-out' | 'dissolve' | 'glitch' | 'flash' | 'whip-pan';
    duration: number; // seconds (e.g. 0.5)
  };
  transitionOut?: {
    type: 'fade' | 'wipe-left' | 'wipe-right' | 'zoom-in' | 'zoom-out' | 'dissolve' | 'glitch' | 'flash' | 'whip-pan';
    duration: number;
  };
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'overlay';
  order: number;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  volume: number;
}

export interface ProjectRecord {
  id: string;
  title: string;
  resolution: {
    width: number;
    height: number;
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
    label: string;
  };
  fps: number; // 24, 30, 60
  duration: number; // total duration
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'gif' | 'prores';
  resolution: {
    width: number;
    height: number;
    label: string;
  };
  fps: number;
  codec: 'h264_videotoolbox' | 'hevc_videotoolbox' | 'libx264' | 'libx265' | 'prores_ks' | 'libvpx-vp9';
  bitrateKbps: number; // e.g. 8000 for 8Mbps
  audioBitrateKbps: number; // 192, 320
  qualityPreset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  hardwareAccelerated: boolean;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number; // 0 to 100
  exportSettings: ExportSettings;
  outputFilePath?: string;
  outputFileName: string;
  fileSizeBytes?: number;
  createdAt: number;
  completedAt?: number;
  error?: string;
  ffmpegCommand: string;
  logs: string[];
}
