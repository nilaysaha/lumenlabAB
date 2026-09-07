import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Film, 
  Music, 
  Type, 
  Sparkles, 
  Layers, 
  Sliders, 
  Smile, 
  Plus, 
  Search, 
  Upload, 
  Play, 
  Clock, 
  FileVideo, 
  Volume2,
  Wand2,
  Trash2
} from 'lucide-react';
import { AssetRecord, TimelineClip } from '../types/video';
import { SAMPLE_EFFECTS, SAMPLE_TRANSITIONS, SAMPLE_TEXT_TEMPLATES } from '../services/sampleData';
import { LocalStorageManager } from '../services/storage';

interface MediaLibraryProps {
  onAddClipToTimeline: (clip: Omit<TimelineClip, 'id'>) => void;
  currentTime: number;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onAddClipToTimeline, currentTime }) => {
  const [activeCategory, setActiveCategory] = useState<'media' | 'text' | 'audio' | 'effects' | 'transitions' | 'stickers'>('media');
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [previewingAudio, setPreviewingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const list = await LocalStorageManager.getAssets();
    setAssets(list);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');
      const url = URL.createObjectURL(file);

      const newAsset: AssetRecord = {
        id: `asset_upload_${Date.now()}_${i}`,
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video',
        uri: url,
        duration: isVideo ? 10 : isAudio ? 15 : 5,
        sizeBytes: file.size,
        mimeType: file.type,
        tags: ['Local Upload', isVideo ? 'Video' : isAudio ? 'Audio' : 'Image'],
        thumbnail: isImage ? url : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await LocalStorageManager.saveAsset(newAsset);
    }
    await loadAssets();
  };

  const handleAddAssetToTimeline = (asset: AssetRecord) => {
    if (asset.type === 'video' || asset.type === 'image') {
      onAddClipToTimeline({
        trackId: 'track_video_main',
        assetId: asset.id,
        name: asset.name,
        type: asset.type,
        src: asset.uri,
        thumbnail: asset.thumbnail,
        startTime: currentTime,
        duration: asset.duration || 5,
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
        speed: 1,
        muted: false,
        fadeIn: 0.2,
        fadeOut: 0.2,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'normal' },
        color: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0 },
      });
    } else if (asset.type === 'audio' || asset.type === 'sfx') {
      onAddClipToTimeline({
        trackId: asset.type === 'sfx' ? 'track_sfx' : 'track_music',
        assetId: asset.id,
        name: asset.name,
        type: asset.type,
        src: asset.uri,
        startTime: currentTime,
        duration: asset.duration || 10,
        trimStart: 0,
        trimEnd: 0,
        volume: asset.type === 'sfx' ? 1.0 : 0.8,
        speed: 1,
        muted: false,
        fadeIn: 0.3,
        fadeOut: 0.5,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        color: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0 },
      });
    }
  };

  const handleAddTextTemplate = (tmpl: typeof SAMPLE_TEXT_TEMPLATES[0]) => {
    onAddClipToTimeline({
      trackId: 'track_text',
      name: `Text: ${tmpl.name}`,
      type: 'text',
      src: '',
      startTime: currentTime,
      duration: 4.0,
      trimStart: 0,
      trimEnd: 0,
      volume: 0,
      speed: 1,
      muted: true,
      fadeIn: 0.2,
      fadeOut: 0.2,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      color: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0 },
      textData: {
        text: tmpl.text,
        fontFamily: tmpl.fontFamily,
        fontSize: tmpl.fontSize,
        fontWeight: tmpl.fontWeight,
        color: tmpl.color,
        backgroundColor: tmpl.backgroundColor,
        strokeColor: tmpl.strokeColor,
        strokeWidth: tmpl.strokeWidth,
        shadowColor: tmpl.shadowColor,
        shadowBlur: tmpl.shadowBlur,
        animation: tmpl.animation,
        alignment: 'center',
      }
    });
  };

  const playAudioPreview = (src: string) => {
    if (audioElement) {
      audioElement.pause();
    }
    if (previewingAudio === src) {
      setPreviewingAudio(null);
      return;
    }
    const audio = new Audio(src);
    audio.play();
    audio.onended = () => setPreviewingAudio(null);
    setAudioElement(audio);
    setPreviewingAudio(src);
  };

  const filteredAssets = assets.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.tags.some(t => t.toLowerCase().includes(q))) {
        return false;
      }
    }
    if (selectedTag !== 'all') {
      if (!a.tags.includes(selectedTag)) return false;
    }
    if (activeCategory === 'media') return a.type === 'video' || a.type === 'image';
    if (activeCategory === 'audio') return a.type === 'audio' || a.type === 'sfx';
    return true;
  });

  return (
    <div className="w-80 h-full bg-[#14171E] border-r border-[#2D3139] flex flex-col shrink-0 select-none overflow-hidden">
      {/* Category Icons Bar */}
      <div className="flex items-center justify-around border-b border-[#2D3139] bg-[#101218] p-1">
        <button
          onClick={() => setActiveCategory('media')}
          className={`flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium transition-all ${
            activeCategory === 'media' ? 'text-indigo-400 bg-[#1F232D] shadow-sm' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveCategory('text')}
          className={`flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium transition-all ${
            activeCategory === 'text' ? 'text-indigo-400 bg-[#1F232D] shadow-sm' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Text & Titles</span>
        </button>

        <button
          onClick={() => setActiveCategory('audio')}
          className={`flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium transition-all ${
            activeCategory === 'audio' ? 'text-indigo-400 bg-[#1F232D] shadow-sm' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Audio</span>
        </button>

        <button
          onClick={() => setActiveCategory('effects')}
          className={`flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium transition-all ${
            activeCategory === 'effects' ? 'text-indigo-400 bg-[#1F232D] shadow-sm' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Effects</span>
        </button>

        <button
          onClick={() => setActiveCategory('transitions')}
          className={`flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium transition-all ${
            activeCategory === 'transitions' ? 'text-indigo-400 bg-[#1F232D] shadow-sm' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Transitions</span>
        </button>
      </div>

      {/* Sub-Header / Search & Import */}
      <div className="p-3 border-b border-[#2D3139] space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={`Search ${activeCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {activeCategory === 'media' && (
            <label className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-md cursor-pointer font-medium transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" multiple accept="video/*,audio/*,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Filter Tags */}
        {activeCategory === 'media' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {['all', 'Cinematic', 'Cyberpunk', 'Creator', 'Drone', 'SFX', 'Music'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[10px] px-2.5 py-0.5 rounded-full capitalize whitespace-nowrap transition-colors ${
                  selectedTag === tag ? 'bg-indigo-600 text-white font-semibold' : 'bg-[#1A1E27] border border-[#2D3139] text-[#94A3B8] hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {/* MEDIA TAB */}
        {activeCategory === 'media' && (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-[#1A1E27] border border-[#2D3139] rounded-md overflow-hidden hover:border-indigo-500 transition-all cursor-pointer flex flex-col"
                onClick={() => handleAddAssetToTimeline(asset)}
              >
                <div className="relative aspect-video bg-[#0F1115] overflow-hidden">
                  {asset.thumbnail ? (
                    <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                      <FileVideo className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 py-0.2 rounded text-[#E0E0E0]">
                    {asset.duration?.toFixed(1)}s
                  </span>
                  <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="p-1.5 flex flex-col justify-between flex-1">
                  <div className="text-[11px] font-medium text-[#E0E0E0] truncate">{asset.name}</div>
                  <div className="flex items-center justify-between text-[9px] text-[#94A3B8] mt-1">
                    <span className="uppercase font-mono">{asset.type}</span>
                    <span>{asset.fps ? `${asset.fps}fps` : '48kHz'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEXT & TITLES TAB */}
        {activeCategory === 'text' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-1">
              CapCut Animated Text Presets
            </div>
            {SAMPLE_TEXT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.name}
                onClick={() => handleAddTextTemplate(tmpl)}
                className="group p-3 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-md cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#E0E0E0]">{tmpl.name}</div>
                  <div className="text-sm font-bold tracking-wide" style={{ color: tmpl.color }}>
                    {tmpl.text}
                  </div>
                  <div className="text-[10px] text-indigo-400 font-mono">Animation: {tmpl.animation}</div>
                </div>
                <div className="w-7 h-7 rounded-md bg-[#222630] group-hover:bg-indigo-600 text-[#94A3B8] group-hover:text-white flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AUDIO & SFX TAB */}
        {activeCategory === 'audio' && (
          <div className="space-y-1.5">
            {assets.filter(a => a.type === 'audio' || a.type === 'sfx').map((asset) => (
              <div
                key={asset.id}
                className="p-2 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-md flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => playAudioPreview(asset.uri)}
                    className="w-7 h-7 rounded-md bg-[#222630] hover:bg-indigo-600 text-[#94A3B8] hover:text-white flex items-center justify-center shrink-0 transition-colors"
                  >
                    {previewingAudio === asset.uri ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#E0E0E0] truncate">{asset.name}</div>
                    <div className="text-[10px] text-[#94A3B8] flex items-center gap-2">
                      <span className="uppercase text-emerald-400 font-semibold font-mono">{asset.type}</span>
                      <span>{asset.duration}s</span>
                      <span>2 Channels</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAddAssetToTimeline(asset)}
                  className="p-1.5 rounded-md bg-[#222630] hover:bg-indigo-600 text-[#94A3B8] hover:text-white transition-colors"
                  title="Add to Timeline"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* EFFECTS & LUTS TAB */}
        {activeCategory === 'effects' && (
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_EFFECTS.map((eff) => (
              <div
                key={eff.id}
                onClick={() => {
                  onAddClipToTimeline({
                    trackId: 'track_overlay',
                    name: `FX: ${eff.name}`,
                    type: 'adjustment',
                    src: '',
                    startTime: currentTime,
                    duration: 5.0,
                    trimStart: 0,
                    trimEnd: 0,
                    volume: 0,
                    speed: 1,
                    muted: true,
                    fadeIn: 0.2,
                    fadeOut: 0.2,
                    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                    color: { brightness: 0, contrast: 20, saturation: 25, temperature: 0, tint: 0, vignette: 20, sharpen: 15, filterLut: eff.id },
                  });
                }}
                className="group p-2.5 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-md cursor-pointer transition-all flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: eff.preview }}>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-black/40 px-1 py-0.5 rounded text-[#94A3B8]">LUT 3D</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#E0E0E0] group-hover:text-indigo-400">{eff.name}</div>
                  <div className="text-[10px] text-[#94A3B8] line-clamp-1">{eff.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRANSITIONS TAB */}
        {activeCategory === 'transitions' && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-1">
              FFmpeg xfade Transitions
            </div>
            {SAMPLE_TRANSITIONS.map((tr) => (
              <div
                key={tr.id}
                className="p-2.5 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-md flex items-center justify-between cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#222630] text-indigo-400 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#E0E0E0]">{tr.name}</div>
                    <div className="text-[10px] text-[#94A3B8] font-mono">Duration: {tr.duration}s</div>
                  </div>
                </div>
                <div className="text-[10px] text-[#94A3B8] bg-[#222630] px-2.5 py-1 rounded group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  Apply
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
