import React, { useRef, useState, useEffect } from 'react';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Layers,
  Sparkles,
  Type,
  Music,
  Film
} from 'lucide-react';
import { ProjectRecord, TimelineClip, TimelineTrack } from '../types/video';

interface TimelineProps {
  project: ProjectRecord;
  currentTime: number;
  onSeek: (time: number) => void;
  selectedClipId: string | null;
  onSelectClip: (clip: TimelineClip | null) => void;
  onUpdateClip: (clip: TimelineClip) => void;
  onDeleteClip: (id: string) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onAddTrack: (type: 'video' | 'audio' | 'text' | 'overlay') => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  onSeek,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onSplitClip,
  onAddTrack,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoomPixelsPerSecond, setZoomPixelsPerSecond] = useState(48); // 48px = 1 sec
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartClipTime, setDragStartClipTime] = useState(0);
  const [trimmingClipId, setTrimmingClipId] = useState<string | null>(null);
  const [trimDirection, setTrimDirection] = useState<'left' | 'right' | null>(null);

  const totalDuration = Math.max(15, project.duration);
  const timelineWidth = totalDuration * zoomPixelsPerSecond;

  // Handle Playhead Scrubbing on Ruler
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPlayhead(true);
    updateTimeFromMouse(e);
  };

  const updateTimeFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(totalDuration, clickX / zoomPixelsPerSecond));
    onSeek(time);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        updateTimeFromMouse(e);
      } else if (draggingClipId) {
        const deltaX = e.clientX - dragStartX;
        const deltaTime = deltaX / zoomPixelsPerSecond;
        const clip = project.clips.find(c => c.id === draggingClipId);
        if (clip) {
          const newStart = Math.max(0, dragStartClipTime + deltaTime);
          onUpdateClip({ ...clip, startTime: parseFloat(newStart.toFixed(2)) });
        }
      } else if (trimmingClipId && trimDirection) {
        const deltaX = e.clientX - dragStartX;
        const deltaTime = deltaX / zoomPixelsPerSecond;
        const clip = project.clips.find(c => c.id === trimmingClipId);
        if (clip) {
          if (trimDirection === 'right') {
            const newDuration = Math.max(0.5, dragStartClipTime + deltaTime);
            onUpdateClip({ ...clip, duration: parseFloat(newDuration.toFixed(2)) });
          } else {
            // Trim left
            const newStart = Math.max(0, dragStartClipTime + deltaTime);
            const durationDiff = newStart - clip.startTime;
            const newDuration = Math.max(0.5, clip.duration - durationDiff);
            onUpdateClip({ ...clip, startTime: parseFloat(newStart.toFixed(2)), duration: parseFloat(newDuration.toFixed(2)) });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDraggingClipId(null);
      setTrimmingClipId(null);
      setTrimDirection(null);
    };

    if (isDraggingPlayhead || draggingClipId || trimmingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, draggingClipId, trimmingClipId, trimDirection, dragStartX, dragStartClipTime, zoomPixelsPerSecond, project.clips]);

  const selectedClip = project.clips.find(c => c.id === selectedClipId);

  return (
    <div className="h-72 bg-[#0F1115] border-t border-[#2D3139] flex flex-col select-none overflow-hidden shrink-0">
      {/* Timeline Toolbar (Scissors/Split, Delete, Zoom, Add Track) */}
      <div className="h-10 bg-[#14171E] border-b border-[#2D3139] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Split / Razor Tool */}
          <button
            onClick={() => {
              if (selectedClipId) {
                onSplitClip(selectedClipId, currentTime);
              }
            }}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 bg-[#1A1E27] hover:bg-indigo-600 text-[#E0E0E0] hover:text-white px-2.5 py-1 rounded-md text-xs font-medium disabled:opacity-30 disabled:hover:bg-[#1A1E27] transition-colors border border-[#2D3139]"
            title="Split Clip at Playhead (Cmd+B)"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>Split Clip</span>
            <span className="text-[10px] text-[#94A3B8] font-mono">⌘B</span>
          </button>

          {/* Delete Clip */}
          <button
            onClick={() => {
              if (selectedClipId) onDeleteClip(selectedClipId);
            }}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 bg-[#1A1E27] hover:bg-red-600/80 text-[#E0E0E0] hover:text-white px-2.5 py-1 rounded-md text-xs font-medium disabled:opacity-30 disabled:hover:bg-[#1A1E27] transition-colors border border-[#2D3139]"
            title="Delete Selected Clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="h-4 w-[1px] bg-[#2D3139] mx-1" />

          {/* Add Track */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAddTrack('video')}
              className="flex items-center gap-1 text-[11px] text-[#E0E0E0] hover:text-white bg-[#1A1E27] hover:bg-[#252B38] px-2 py-1 rounded-md transition-colors border border-[#2D3139]"
            >
              <Plus className="w-3 h-3 text-indigo-400" />
              <span>+ Video Track</span>
            </button>
            <button
              onClick={() => onAddTrack('audio')}
              className="flex items-center gap-1 text-[11px] text-[#E0E0E0] hover:text-white bg-[#1A1E27] hover:bg-[#252B38] px-2 py-1 rounded-md transition-colors border border-[#2D3139]"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>+ Audio Track</span>
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#94A3B8] font-mono">{zoomPixelsPerSecond} px/s</span>
          <button
            onClick={() => setZoomPixelsPerSecond(Math.max(20, zoomPixelsPerSecond - 10))}
            className="p-1 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="20"
            max="120"
            value={zoomPixelsPerSecond}
            onChange={(e) => setZoomPixelsPerSecond(parseInt(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer h-1"
          />

          <button
            onClick={() => setZoomPixelsPerSecond(Math.min(120, zoomPixelsPerSecond + 10))}
            className="p-1 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tracks Area with Sticky Left Headers & Horizontally Scrollable Timeline */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers Column */}
        <div className="w-48 bg-[#14171E] border-r border-[#2D3139] shrink-0 z-20 flex flex-col">
          {/* Top corner above ruler */}
          <div className="h-7 border-b border-[#2D3139] px-3 flex items-center justify-between text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider bg-[#101218]">
            <span>Tracks</span>
            <Layers className="w-3 h-3 text-indigo-400" />
          </div>

          {/* Track Labels */}
          <div className="flex-1 overflow-y-hidden">
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className="h-12 border-b border-[#2D3139] px-2.5 flex items-center justify-between bg-[#14171E]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {track.type === 'video' && <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  {track.type === 'audio' && <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {track.type === 'text' && <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {track.type === 'overlay' && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  <span className="text-xs font-medium text-[#E0E0E0] truncate">{track.name}</span>
                </div>

                <div className="flex items-center gap-1 text-[#94A3B8]">
                  <button className="p-1 hover:text-white" title="Mute/Hide Track">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:text-white" title="Lock Track">
                    <Unlock className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Scrolling Timeline & Ruler */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-[#0B0D11]"
        >
          <div style={{ width: `${timelineWidth}px` }} className="relative h-full">
            {/* Timeline Ruler */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-7 border-b border-[#2D3139] bg-[#101218] cursor-pointer relative flex items-end select-none"
            >
              {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => (
                <div
                  key={sec}
                  style={{ left: `${sec * zoomPixelsPerSecond}px` }}
                  className="absolute bottom-0 flex flex-col items-center"
                >
                  <div className="h-2.5 w-[1px] bg-[#363E52]" />
                  <span className="text-[9px] font-mono text-[#94A3B8] -translate-x-1/2 mb-0.5">
                    {sec}s
                  </span>
                </div>
              ))}
            </div>

            {/* Red Draggable Playhead Line */}
            <div
              style={{ left: `${currentTime * zoomPixelsPerSecond}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            >
              {/* Playhead Handle at Top */}
              <div className="w-3 h-3 bg-red-500 -translate-x-1/2 rotate-45 rounded-sm shadow-md" />
            </div>

            {/* Tracks Content Rows */}
            <div className="relative">
              {project.tracks.map((track) => {
                const trackClips = project.clips.filter((c) => c.trackId === track.id);
                return (
                  <div
                    key={track.id}
                    className="h-12 border-b border-[#1F232D] relative bg-[#101218]/40"
                  >
                    {trackClips.map((clip) => {
                      const isSelected = clip.id === selectedClipId;
                      const clipLeft = clip.startTime * zoomPixelsPerSecond;
                      const clipWidth = clip.duration * zoomPixelsPerSecond;

                      // Color theme per track/clip type
                      const bgGradient =
                        clip.type === 'video'
                          ? 'from-indigo-900/90 to-indigo-800/80 border-indigo-500/80 text-indigo-100'
                          : clip.type === 'audio' || clip.type === 'sfx'
                          ? 'from-emerald-900/90 to-emerald-800/80 border-emerald-500/80 text-emerald-100'
                          : clip.type === 'text'
                          ? 'from-amber-900/90 to-amber-800/80 border-amber-500/80 text-amber-100'
                          : 'from-cyan-900/90 to-cyan-800/80 border-cyan-500/80 text-cyan-100';

                      return (
                        <div
                          key={clip.id}
                          style={{
                            left: `${clipLeft}px`,
                            width: `${clipWidth}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip);
                          }}
                          onMouseDown={(e) => {
                            if (e.button === 0) {
                              setDraggingClipId(clip.id);
                              setDragStartX(e.clientX);
                              setDragStartClipTime(clip.startTime);
                              onSelectClip(clip);
                            }
                          }}
                          className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r ${bgGradient} border ${
                            isSelected ? 'ring-2 ring-white border-white shadow-lg' : ''
                          } cursor-grab active:cursor-grabbing flex items-center justify-between px-2 overflow-hidden transition-shadow group`}
                        >
                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setTrimmingClipId(clip.id);
                              setTrimDirection('left');
                              setDragStartX(e.clientX);
                              setDragStartClipTime(clip.startTime);
                            }}
                            className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 hover:bg-white/60 cursor-w-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          />

                          {/* Clip Label & Waveform/Thumbnail Info */}
                          <div className="flex items-center gap-1.5 min-w-0 z-0">
                            {clip.thumbnail && (
                              <img
                                src={clip.thumbnail}
                                alt=""
                                className="w-5 h-5 rounded object-cover shrink-0 border border-black/40"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className="text-[11px] font-semibold truncate tracking-tight">{clip.name}</span>
                          </div>

                          <span className="text-[9px] font-mono opacity-80 shrink-0 ml-1">
                            {clip.duration.toFixed(1)}s
                          </span>

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setTrimmingClipId(clip.id);
                              setTrimDirection('right');
                              setDragStartX(e.clientX);
                              setDragStartClipTime(clip.duration);
                            }}
                            className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 hover:bg-white/60 cursor-e-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
