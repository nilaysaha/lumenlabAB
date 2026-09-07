import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Grid, 
  Crosshair,
  Sliders
} from 'lucide-react';
import { ProjectRecord, TimelineClip } from '../types/video';

interface CanvasPreviewProps {
  project: ProjectRecord;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  selectedClip: TimelineClip | null;
  onUpdateClip: (clip: TimelineClip) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  project,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  selectedClip,
  onUpdateClip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '50%' | '100%' | '200%'>('fit');
  const [showSafeMargins, setShowSafeMargins] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Format seconds to timecode HH:MM:SS:FF
  const formatTimecode = (seconds: number, fps: number = 30) => {
    const totalFrames = Math.floor(seconds * fps);
    const ff = totalFrames % fps;
    const totalSeconds = Math.floor(seconds);
    const ss = totalSeconds % 60;
    const mm = Math.floor(totalSeconds / 60) % 60;
    const hh = Math.floor(totalSeconds / 3600);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  };

  // Render Frame onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = project.resolution.width;
    const height = project.resolution.height;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas background
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    // Get active clips at currentTime sorted by track order
    const activeClips = project.clips.filter(
      c => currentTime >= c.startTime && currentTime <= (c.startTime + c.duration)
    );

    // Render video/visual layers
    activeClips.forEach(clip => {
      ctx.save();

      // Opacity & Fade In / Out
      let alpha = clip.transform.opacity ?? 1;
      const clipElapsed = currentTime - clip.startTime;
      if (clip.fadeIn > 0 && clipElapsed < clip.fadeIn) {
        alpha *= clipElapsed / clip.fadeIn;
      }
      const clipRemaining = (clip.startTime + clip.duration) - currentTime;
      if (clip.fadeOut > 0 && clipRemaining < clip.fadeOut) {
        alpha *= clipRemaining / clip.fadeOut;
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Global composite blend mode
      if (clip.transform.blendMode && clip.transform.blendMode !== 'normal') {
        ctx.globalCompositeOperation = clip.transform.blendMode;
      }

      // Transform translation and rotation
      const posX = (width / 2) + (clip.transform.x / 100) * width;
      const posY = (height / 2) + (clip.transform.y / 100) * height;
      ctx.translate(posX, posY);
      if (clip.transform.rotation) {
        ctx.rotate((clip.transform.rotation * Math.PI) / 180);
      }
      const scale = clip.transform.scale || 1.0;
      ctx.scale(scale, scale);

      // Color filters (Brightness, Contrast, Saturation)
      if (clip.color) {
        const b = 100 + clip.color.brightness;
        const c = 100 + clip.color.contrast;
        const s = 100 + clip.color.saturation;
        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
      }

      // Draw Media Clip
      if (clip.type === 'video' || clip.type === 'image') {
        if (clip.src) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = clip.src;
          if (img.complete) {
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
          } else {
            // Draw placeholder pattern if still loading
            ctx.fillStyle = '#1c202e';
            ctx.fillRect(-width / 2, -height / 2, width, height);
            ctx.fillStyle = '#6366f1';
            ctx.font = 'bold 36px Syne';
            ctx.textAlign = 'center';
            ctx.fillText(clip.name, 0, 0);
          }
        }
      }

      // Draw Text Clip
      if (clip.type === 'text' && clip.textData) {
        const txt = clip.textData;
        ctx.font = `${txt.fontWeight || 'bold'} ${txt.fontSize || 40}px ${txt.fontFamily || 'sans-serif'}`;
        ctx.textAlign = txt.alignment || 'center';
        ctx.textBaseline = 'middle';

        // Background box
        if (txt.backgroundColor && txt.backgroundColor !== 'transparent' && txt.backgroundColor !== 'none') {
          const metrics = ctx.measureText(txt.text);
          const boxPadding = 16;
          const boxW = metrics.width + boxPadding * 2;
          const boxH = (txt.fontSize || 40) + boxPadding * 1.2;

          ctx.fillStyle = txt.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
          ctx.fill();
        }

        // Stroke
        if (txt.strokeColor && txt.strokeWidth) {
          ctx.strokeStyle = txt.strokeColor;
          ctx.lineWidth = txt.strokeWidth;
          ctx.strokeText(txt.text, 0, 0);
        }

        // Shadow / Glow
        if (txt.shadowColor && txt.shadowBlur) {
          ctx.shadowColor = txt.shadowColor;
          ctx.shadowBlur = txt.shadowBlur;
        }

        // Text fill
        ctx.fillStyle = txt.color || '#ffffff';
        ctx.fillText(txt.text, 0, 0);
      }

      ctx.restore();
    });

    // Draw Safe Margins & Framing
    if (showSafeMargins) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      
      // 90% Safe Action Zone
      const marginX = width * 0.05;
      const marginY = height * 0.05;
      ctx.strokeRect(marginX, marginY, width - marginX * 2, height - marginY * 2);

      // Center crosshair
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 20, height / 2);
      ctx.lineTo(width / 2 + 20, height / 2);
      ctx.moveTo(width / 2, height / 2 - 20);
      ctx.lineTo(width / 2, height / 2 + 20);
      ctx.stroke();

      ctx.restore();
    }
  }, [currentTime, project, showSafeMargins]);

  // Aspect ratio calculation
  const aspectClass = 
    project.resolution.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[92%]' :
    project.resolution.aspectRatio === '1:1' ? 'aspect-square max-h-[92%]' :
    project.resolution.aspectRatio === '4:5' ? 'aspect-[4/5] max-h-[92%]' :
    project.resolution.aspectRatio === '21:9' ? 'aspect-[21/9] max-w-[94%]' :
    'aspect-video max-h-[92%]';

  return (
    <div className="flex-1 h-full bg-[#0B0D11] flex flex-col select-none overflow-hidden relative">
      {/* Top Preview Status Bar */}
      <div className="h-9 bg-[#14171E] border-b border-[#2D3139] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-[#E0E0E0] font-medium">Canvas: {project.resolution.width} × {project.resolution.height}</span>
          <span className="text-[#475569]">|</span>
          <span className="text-indigo-400 font-mono text-[11px] font-semibold">{project.resolution.aspectRatio}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Safe Margins Toggle */}
          <button
            onClick={() => setShowSafeMargins(!showSafeMargins)}
            className={`p-1 rounded-md text-xs flex items-center gap-1 transition-colors ${
              showSafeMargins ? 'bg-indigo-600/25 text-indigo-300' : 'text-[#94A3B8] hover:text-white'
            }`}
            title="Toggle Safe Margins & Crosshairs"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="text-[11px]">Safe Zones</span>
          </button>

          {/* Zoom Level */}
          <div className="flex items-center bg-[#1A1E27] border border-[#2D3139] rounded-md px-1.5 py-0.5 text-xs">
            <span className="text-[#94A3B8] text-[10px] mr-1">Zoom:</span>
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value as any)}
              className="bg-transparent text-[#E0E0E0] text-xs focus:outline-none cursor-pointer"
            >
              <option value="fit" className="bg-[#1A1E27]">Fit</option>
              <option value="50%" className="bg-[#1A1E27]">50%</option>
              <option value="100%" className="bg-[#1A1E27]">100%</option>
              <option value="200%" className="bg-[#1A1E27]">200%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-[#0F1115]"
      >
        <div className={`relative shadow-2xl rounded-md overflow-hidden border border-[#2D3139] bg-black ${aspectClass} flex items-center justify-center transition-all`}>
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />

          {/* Active Transform Gizmo overlay if clip selected */}
          {selectedClip && selectedClip.type !== 'audio' && selectedClip.type !== 'sfx' && (
            <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/80 rounded">
              <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shadow">
                {selectedClip.name} • {(selectedClip.transform.scale * 100).toFixed(0)}%
              </div>
              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Playback Control Bar */}
      <div className="h-12 bg-[#14171E] border-t border-[#2D3139] flex items-center justify-between px-4 shrink-0">
        {/* Current Timecode */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-white font-bold tracking-wider">{formatTimecode(currentTime, project.fps)}</span>
          <span className="text-[#475569]">/</span>
          <span className="text-[#94A3B8]">{formatTimecode(project.duration, project.fps)}</span>
        </div>

        {/* Central Transport Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Go to Start (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentTime - (1 / project.fps)))}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Step 1 Frame Backward (Left Arrow)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            title="Play / Pause (Spacebar)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => onSeek(Math.min(project.duration, currentTime + (1 / project.fps)))}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Step 1 Frame Forward (Right Arrow)"
          >
            <RotateCcw className="w-4 h-4 scale-x-[-1]" />
          </button>

          <button
            onClick={() => onSeek(project.duration)}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Go to End (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Audio & Fullscreen Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Mute Preview Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
