export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export interface ResolutionConfig {
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  label: string;
}

export interface KeyframePoint {
  time: number; // in seconds relative to clip start
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
  temperature: number; // -100 to 100 (warm/cool)
  tint: number; // -100 to 100 (green/magenta)
  vignette: number; // 0 to 100
  sharpen: number; // 0 to 100
  filterLut?: string; // 'none' | 'cinematic' | 'vintage' | 'cyberpunk' | 'teal-orange' | 'bw' | 'vhs' | 'moody';
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

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'sfx' | 'sticker' | 'adjustment';

export interface TimelineClip {
  id: string;
  trackId: string;
  assetId?: string;
  name: string;
  type: ClipType;
  src: string;
  thumbnail?: string;
  
  // Placement on timeline
  startTime: number; // start in seconds
  duration: number; // duration in seconds
  trimStart: number; // trim offset from start of source
  trimEnd: number; // trim offset from end of source
  
  // Audio & Speed
  volume: number; // 0 to 2
  speed: number; // 0.1 to 10
  muted: boolean;
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  
  // Visuals & Transform
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
    duration: number;
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
  resolution: ResolutionConfig;
  fps: number;
  duration: number;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'sfx' | 'sticker';
  uri: string;
  localPath?: string;
  duration: number;
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

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'gif' | 'prores';
  resolution: {
    width: number;
    height: number;
    label: string;
  };
  fps: number;
  codec: 'h264_videotoolbox' | 'hevc_videotoolbox' | 'libx264' | 'libx265' | 'prores_ks' | 'libvpx-vp9';
  bitrateKbps: number;
  audioBitrateKbps: number;
  qualityPreset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  hardwareAccelerated: boolean;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
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
