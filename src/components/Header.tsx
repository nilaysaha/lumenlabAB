import React, { useState } from 'react';
import { 
  Film, 
  Sparkles, 
  HardDrive, 
  Terminal, 
  Apple, 
  Download, 
  Undo2, 
  Redo2, 
  Magnet, 
  Layers, 
  CheckCircle2, 
  Cpu,
  ChevronDown
} from 'lucide-react';
import { ProjectRecord } from '../types/video';
import { RESOLUTION_PRESETS } from '../services/sampleData';

interface HeaderProps {
  project: ProjectRecord;
  onUpdateProject: (updated: ProjectRecord) => void;
  activeTab: 'editor' | 'assets' | 'ai' | 'ffmpeg' | 'electron';
  setActiveTab: (tab: 'editor' | 'assets' | 'ai' | 'ffmpeg' | 'electron') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  snapping: boolean;
  setSnapping: (val: boolean) => void;
  autoRipple: boolean;
  setAutoRipple: (val: boolean) => void;
  onOpenExport: () => void;
  onOpenAiModal: () => void;
  renderQueueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onUpdateProject,
  activeTab,
  setActiveTab,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  snapping,
  setSnapping,
  autoRipple,
  setAutoRipple,
  onOpenExport,
  renderQueueCount,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [showResMenu, setShowResMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== project.title) {
      onUpdateProject({ ...project, title: title.trim() });
    }
  };

  return (
    <header className="h-14 bg-[#14171E] border-b border-[#2D3139] flex items-center justify-between px-3 shrink-0 z-40 select-none">
      {/* Left Section: macOS Traffic Lights & Project Info */}
      <div className="flex items-center gap-3">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-1.5 px-1 py-1 group">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer shadow-sm hover:brightness-110" title="Close Window" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer shadow-sm hover:brightness-110" title="Minimize" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer shadow-sm hover:brightness-110" title="Full Screen" />
        </div>

        <div className="h-5 w-[1px] bg-[#2D3139] mx-1" />

        {/* Brand & Project Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A1E27] border border-[#2D3139]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-[#E0E0E0] font-['Syne']">LUMENLAB</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-mono font-medium">DESKTOP</span>
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-[#1A1E27] border border-indigo-500 text-sm px-2 py-1 rounded text-white font-medium outline-none"
            />
          ) : (
            <button
              onClick={() => { setTitle(project.title); setIsEditingTitle(true); }}
              className="text-xs font-medium text-gray-200 hover:text-white px-2.5 py-1 rounded-md hover:bg-[#1A1E27] border border-transparent hover:border-[#2D3139] max-w-[200px] truncate text-left transition-colors"
              title="Click to rename project"
            >
              {project.title}
            </button>
          )}
        </div>

        {/* Resolution & Aspect Ratio Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowResMenu(!showResMenu)}
            className="flex items-center gap-1.5 text-xs bg-[#1A1E27] hover:bg-[#232834] text-[#E0E0E0] border border-[#2D3139] px-2.5 py-1 rounded-md transition-colors"
          >
            <span className="font-mono text-indigo-400 text-[11px] font-semibold">{project.resolution.aspectRatio}</span>
            <span className="text-[#64748B]">|</span>
            <span className="text-[11px]">{project.resolution.label.split('(')[0]}</span>
            <span className="text-[10px] text-[#94A3B8] font-mono">@{project.fps}fps</span>
            <ChevronDown className="w-3 h-3 text-[#94A3B8] ml-0.5" />
          </button>

          {showResMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1A1E27] border border-[#2D3139] rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-[#2D3139]">
                Resolution & Aspect Ratio
              </div>
              {RESOLUTION_PRESETS.map((res) => (
                <button
                  key={res.label}
                  onClick={() => {
                    onUpdateProject({ ...project, resolution: res });
                    setShowResMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#252A36] transition-colors ${
                    project.resolution.label === res.label ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-gray-300'
                  }`}
                >
                  <div>
                    <div className="text-xs">{res.label}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{res.width} × {res.height}</div>
                  </div>
                  {project.resolution.label === res.label && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-t border-b border-[#2D3139] mt-1">
                Frame Rate (FPS)
              </div>
              <div className="flex gap-1 p-2">
                {[24, 30, 60].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      onUpdateProject({ ...project, fps: f });
                      setShowResMenu(false);
                    }}
                    className={`flex-1 py-1 rounded-md text-xs font-mono font-medium ${
                      project.fps === f ? 'bg-indigo-600 text-white' : 'bg-[#252A36] text-gray-400 hover:text-white'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Workspace Mode Tabs */}
      <div className="flex items-center bg-[#0F1115] p-1 rounded-lg border border-[#2D3139]">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'editor'
              ? 'bg-[#222630] text-white shadow-sm border border-[#373E4D]'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-indigo-400" />
          <span>Timeline Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'assets'
              ? 'bg-[#222630] text-white shadow-sm border border-[#373E4D]'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Asset Vault</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'ai'
              ? 'bg-[#222630] text-white shadow-sm border border-[#373E4D]'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('ffmpeg')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'ffmpeg'
              ? 'bg-[#222630] text-white shadow-sm border border-[#373E4D]'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>FFmpeg Engine</span>
          {renderQueueCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center animate-pulse">
              {renderQueueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('electron')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'electron'
              ? 'bg-[#222630] text-white shadow-sm border border-[#373E4D]'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Apple className="w-3.5 h-3.5 text-gray-300" />
          <span>macOS Desktop</span>
        </button>
      </div>

      {/* Right Section: Timeline Actions & Export */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#1A1E27] border border-[#2D3139] rounded-md p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-[#252A36] text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-[#252A36] text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snapping & Auto-Ripple Toggles */}
        <div className="flex items-center bg-[#1A1E27] border border-[#2D3139] rounded-md p-0.5">
          <button
            onClick={() => setSnapping(!snapping)}
            className={`p-1 rounded text-xs flex items-center gap-1 px-2.5 py-1 transition-colors ${
              snapping ? 'bg-indigo-600/25 text-indigo-300 font-medium' : 'text-[#94A3B8] hover:text-white'
            }`}
            title="Toggle Snapping (N)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="text-[11px]">Snap</span>
          </button>
          <button
            onClick={() => setAutoRipple(!autoRipple)}
            className={`p-1 rounded text-xs flex items-center gap-1 px-2.5 py-1 transition-colors ${
              autoRipple ? 'bg-emerald-600/25 text-emerald-300 font-medium' : 'text-[#94A3B8] hover:text-white'
            }`}
            title="Auto Ripple Edit"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px]">Ripple</span>
          </button>
        </div>

        {/* Export Video Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all border border-indigo-400/30 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video</span>
          <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-mono">⌘E</span>
        </button>
      </div>
    </header>
  );
};
