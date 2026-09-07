import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MediaLibrary } from './components/MediaLibrary';
import { CanvasPreview } from './components/CanvasPreview';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { AiStudioModal } from './components/AiStudioModal';
import { ElectronHub } from './components/ElectronHub';
import { FfmpegQueueModal } from './components/FfmpegQueueModal';
import { AssetVaultView } from './components/AssetVaultView';
import { AiStudioView } from './components/AiStudioView';
import { ProjectRecord, TimelineClip, RenderJob } from './types/video';
import { LocalStorageManager } from './services/storage';
import { SAMPLE_PROJECT } from './services/sampleData';

export default function App() {
  const [project, setProject] = useState<ProjectRecord>(SAMPLE_PROJECT);
  const [history, setHistory] = useState<ProjectRecord[]>([SAMPLE_PROJECT]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'assets' | 'ai' | 'ffmpeg' | 'electron'>('editor');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_v1');
  
  const [snapping, setSnapping] = useState<boolean>(true);
  const [autoRipple, setAutoRipple] = useState<boolean>(false);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [activeRenderJobs, setActiveRenderJobs] = useState<RenderJob[]>([]);

  // Load project on mount
  useEffect(() => {
    loadSavedProject();
  }, []);

  const loadSavedProject = async () => {
    const loaded = await LocalStorageManager.loadProject();
    setProject(loaded);
    setHistory([loaded]);
    setHistoryIndex(0);
    if (loaded.clips.length > 0) {
      setSelectedClipId(loaded.clips[0].id);
    }
  };

  // Auto-save project changes
  const updateProjectState = (newProject: ProjectRecord, pushHistory: boolean = true) => {
    setProject(newProject);
    LocalStorageManager.saveProject(newProject);

    if (pushHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newProject);
      if (newHistory.length > 30) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      const prev = history[targetIndex];
      setProject(prev);
      LocalStorageManager.saveProject(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      const next = history[targetIndex];
      setProject(next);
      LocalStorageManager.saveProject(next);
    }
  };

  // Playback loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      if (isPlaying) {
        const deltaSec = (timestamp - lastTimestamp) / 1000;
        setCurrentTime(prev => {
          const next = prev + deltaSec;
          if (next >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, project.duration]);

  // Global Keyboard Shortcuts (Space, Cmd+B, Cmd+Z, Cmd+E, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (cmdKey && e.code === 'KeyB') {
        e.preventDefault();
        if (selectedClipId) {
          handleSplitClip(selectedClipId, currentTime);
        }
      } else if (cmdKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (cmdKey && e.code === 'KeyE') {
        e.preventDefault();
        setIsExportModalOpen(true);
      } else if (e.code === 'Backspace' || e.code === 'Delete') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(prev => Math.max(0, prev - (1 / project.fps)));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(prev => Math.min(project.duration, prev + (1 / project.fps)));
      } else if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        setCurrentTime(project.duration);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, currentTime, project, historyIndex, history]);

  // Electron native menu listener
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      const cleanup = window.electronAPI.onMenuAction((action) => {
        if (action === 'toggle-playback') setIsPlaying(prev => !prev);
        if (action === 'undo') handleUndo();
        if (action === 'redo') handleRedo();
        if (action === 'split-clip' && selectedClipId) handleSplitClip(selectedClipId, currentTime);
        if (action === 'export-video') setIsExportModalOpen(true);
      });
      return cleanup;
    }
  }, [selectedClipId, currentTime, historyIndex, history]);

  // Clip CRUD & Timeline Operations
  const handleAddClip = (clipData: Omit<TimelineClip, 'id'>) => {
    const id = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newClip: TimelineClip = { ...clipData, id };
    const updatedClips = [...project.clips, newClip];
    const newDuration = Math.max(project.duration, newClip.startTime + newClip.duration);

    updateProjectState({
      ...project,
      clips: updatedClips,
      duration: parseFloat(newDuration.toFixed(2)),
    });
    setSelectedClipId(id);
  };

  const handleUpdateClip = (updatedClip: TimelineClip) => {
    const updatedClips = project.clips.map(c => c.id === updatedClip.id ? updatedClip : c);
    let maxDur = 10;
    updatedClips.forEach(c => {
      maxDur = Math.max(maxDur, c.startTime + c.duration);
    });

    updateProjectState({
      ...project,
      clips: updatedClips,
      duration: parseFloat(maxDur.toFixed(2)),
    });
  };

  const handleDeleteClip = (clipId: string) => {
    const updatedClips = project.clips.filter(c => c.id !== clipId);
    let maxDur = 10;
    updatedClips.forEach(c => {
      maxDur = Math.max(maxDur, c.startTime + c.duration);
    });

    updateProjectState({
      ...project,
      clips: updatedClips,
      duration: parseFloat(maxDur.toFixed(2)),
    });
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  const handleDuplicateClip = (clip: TimelineClip) => {
    const newId = `clip_dup_${Date.now()}`;
    const duplicated: TimelineClip = {
      ...clip,
      id: newId,
      startTime: clip.startTime + clip.duration + 0.1,
    };
    handleAddClip(duplicated);
  };

  const handleSplitClip = (clipId: string, splitTime: number) => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return;

    if (splitTime <= clip.startTime || splitTime >= (clip.startTime + clip.duration)) {
      return;
    }

    const firstDuration = splitTime - clip.startTime;
    const secondDuration = clip.duration - firstDuration;

    const firstClip: TimelineClip = {
      ...clip,
      duration: parseFloat(firstDuration.toFixed(2)),
    };

    const secondClip: TimelineClip = {
      ...clip,
      id: `clip_split_${Date.now()}`,
      startTime: parseFloat(splitTime.toFixed(2)),
      duration: parseFloat(secondDuration.toFixed(2)),
      trimStart: clip.trimStart + firstDuration,
    };

    const updatedClips = project.clips.map(c => c.id === clipId ? firstClip : c);
    updatedClips.push(secondClip);

    updateProjectState({
      ...project,
      clips: updatedClips,
    });
    setSelectedClipId(secondClip.id);
  };

  const handleAddTrack = (type: 'video' | 'audio' | 'text' | 'overlay') => {
    const trackId = `track_${type}_${Date.now()}`;
    const newTrack = {
      id: trackId,
      name: `${type.toUpperCase()} Track ${project.tracks.length + 1}`,
      type,
      order: project.tracks.length,
      muted: false,
      locked: false,
      hidden: false,
      volume: 1.0,
    };

    updateProjectState({
      ...project,
      tracks: [...project.tracks, newTrack],
    });
  };

  const handleApplyAiCaptions = (captions: Array<{ text: string; startTime: number; duration: number }>) => {
    const newClips: TimelineClip[] = captions.map((cap, idx) => ({
      id: `clip_ai_caption_${Date.now()}_${idx}`,
      trackId: 'track_text',
      name: `AI Sub: "${cap.text.slice(0, 15)}..."`,
      type: 'text',
      src: '',
      startTime: cap.startTime,
      duration: cap.duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 0,
      speed: 1,
      muted: true,
      fadeIn: 0.15,
      fadeOut: 0.15,
      transform: { x: 0, y: 25, scale: 1.0, rotation: 0, opacity: 1 },
      color: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0 },
      textData: {
        text: cap.text,
        fontFamily: 'Syne',
        fontSize: 36,
        fontWeight: '800',
        color: '#ffea00',
        strokeColor: '#000000',
        strokeWidth: 3,
        shadowColor: 'rgba(255, 234, 0, 0.5)',
        shadowBlur: 14,
        backgroundColor: 'rgba(14, 16, 21, 0.8)',
        animation: 'bounce',
        alignment: 'center',
      },
    }));

    updateProjectState({
      ...project,
      clips: [...project.clips, ...newClips],
    });
  };

  const selectedClip = project.clips.find(c => c.id === selectedClipId) || null;

  return (
    <div className="h-screen w-screen bg-[#0F1115] text-[#E0E0E0] flex flex-col select-none overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Top Application Header */}
      <Header
        project={project}
        onUpdateProject={(p) => updateProjectState(p)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        snapping={snapping}
        setSnapping={setSnapping}
        autoRipple={autoRipple}
        setAutoRipple={setAutoRipple}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        renderQueueCount={activeRenderJobs.length}
      />

      {/* Main Workspace Workspace Views */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Upper Split (Media Bin | Canvas Player | Inspector) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Media Bin */}
              <MediaLibrary
                onAddClipToTimeline={handleAddClip}
                currentTime={currentTime}
              />

              {/* Central Video Canvas Preview */}
              <CanvasPreview
                project={project}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(prev => !prev)}
                onSeek={(t) => setCurrentTime(t)}
                selectedClip={selectedClip}
                onUpdateClip={handleUpdateClip}
              />

              {/* Right Properties Inspector */}
              <Inspector
                clip={selectedClip}
                onUpdateClip={handleUpdateClip}
                onDeleteClip={handleDeleteClip}
                onDuplicateClip={handleDuplicateClip}
                currentTime={currentTime}
              />
            </div>

            {/* Bottom Multi-Track Timeline */}
            <Timeline
              project={project}
              currentTime={currentTime}
              onSeek={(t) => setCurrentTime(t)}
              selectedClipId={selectedClipId}
              onSelectClip={(c) => setSelectedClipId(c ? c.id : null)}
              onUpdateClip={handleUpdateClip}
              onDeleteClip={handleDeleteClip}
              onSplitClip={handleSplitClip}
              onAddTrack={handleAddTrack}
            />
          </div>
        )}

        {/* Asset Vault View */}
        {activeTab === 'assets' && (
          <AssetVaultView
            onAddClipToTimeline={(clip) => {
              handleAddClip(clip);
              setActiveTab('editor');
            }}
            currentTime={currentTime}
          />
        )}

        {/* AI Studio View */}
        {activeTab === 'ai' && (
          <AiStudioView
            project={project}
            onApplyCaptions={handleApplyAiCaptions}
            onAddGeneratedScene={() => {}}
            onSwitchToEditor={() => setActiveTab('editor')}
          />
        )}

        {/* FFmpeg Engine & Render Queue */}
        {activeTab === 'ffmpeg' && (
          <FfmpegQueueModal />
        )}

        {/* macOS Desktop & Electron Hub */}
        {activeTab === 'electron' && (
          <ElectronHub />
        )}
      </main>

      {/* Export Modal Dialog */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        onJobStarted={(job) => {
          setActiveRenderJobs(prev => [job, ...prev]);
          setActiveTab('ffmpeg');
        }}
      />

      {/* AI Studio Modal Dialog */}
      <AiStudioModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyCaptions={handleApplyAiCaptions}
        videoDuration={project.duration}
      />
    </div>
  );
}
