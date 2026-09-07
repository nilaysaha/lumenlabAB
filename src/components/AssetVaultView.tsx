import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Upload, 
  Search, 
  FileVideo, 
  Music, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Tag, 
  Check, 
  Info, 
  Film,
  Download
} from 'lucide-react';
import { AssetRecord, TimelineClip } from '../types/video';
import { LocalStorageManager } from '../services/storage';

interface AssetVaultViewProps {
  onAddClipToTimeline: (clip: Omit<TimelineClip, 'id'>) => void;
  currentTime: number;
}

export const AssetVaultView: React.FC<AssetVaultViewProps> = ({ onAddClipToTimeline, currentTime }) => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const list = await LocalStorageManager.getAssets();
    setAssets(list);
    if (list.length > 0 && !selectedAsset) {
      setSelectedAsset(list[0]);
    }
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
        id: `asset_${Date.now()}_${i}`,
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video',
        uri: url,
        duration: isVideo ? 8.5 : isAudio ? 12 : 5,
        width: isVideo || isImage ? 1920 : undefined,
        height: isVideo || isImage ? 1080 : undefined,
        fps: isVideo ? 30 : undefined,
        sizeBytes: file.size,
        mimeType: file.type,
        codec: isVideo ? 'h264' : isAudio ? 'mp3' : 'png',
        tags: ['Local Import', isVideo ? 'Video' : isAudio ? 'Audio' : 'Image'],
        thumbnail: isImage ? url : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await LocalStorageManager.saveAsset(newAsset);
    }
    await loadAssets();
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    if (selectedAsset?.id === id) {
      setSelectedAsset(updated[0] || null);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (activeFilter !== 'all' && a.type !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="flex-1 h-full bg-[#0F1115] overflow-hidden flex flex-col p-6 select-none">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-5 overflow-hidden">
        {/* Header & Upload Controls */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Local Asset Vault & Media Database</h2>
              <p className="text-xs text-[#94A3B8]">Offline-persisted assets, waveforms, metadata, and local tags</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Media to Vault</span>
              <input type="file" multiple accept="video/*,audio/*,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between bg-[#14171E] border border-[#2D3139] rounded-xl p-3 shrink-0">
          <div className="flex items-center gap-2">
            {['all', 'video', 'audio', 'sfx', 'image'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  activeFilter === type
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1E27]'
                }`}
              >
                {type === 'all' ? 'All Assets' : type}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search assets by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Grid and Detail Pane */}
        <div className="flex-1 grid grid-cols-3 gap-5 overflow-hidden">
          {/* Asset Grid */}
          <div className="col-span-2 bg-[#14171E] border border-[#2D3139] rounded-xl p-4 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-3 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group bg-[#1A1E27] border rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-[#2D3139] hover:border-[#4B5263]'
                    }`}
                  >
                    <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      ) : asset.type === 'audio' || asset.type === 'sfx' ? (
                        <Music className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <FileVideo className="w-8 h-8 text-indigo-400" />
                      )}
                      <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono bg-black/80 text-gray-300 px-1.5 py-0.5 rounded">
                        {asset.duration}s
                      </span>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div className="text-xs font-semibold text-[#E0E0E0] truncate">{asset.name}</div>
                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mt-2">
                        <span className="uppercase font-semibold text-indigo-400">{asset.type}</span>
                        <span>{((asset.sizeBytes || 1000000) / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset Inspector Detail */}
          <div className="bg-[#14171E] border border-[#2D3139] rounded-xl p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            {selectedAsset ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white break-words">{selectedAsset.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono uppercase font-bold">
                      {selectedAsset.type}
                    </span>
                    <span className="text-xs text-[#94A3B8] font-mono">
                      {((selectedAsset.sizeBytes || 5000000) / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                {/* Metadata List */}
                <div className="bg-[#0B0D11] border border-[#2D3139] rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Duration:</span>
                    <span className="text-[#E0E0E0]">{selectedAsset.duration} seconds</span>
                  </div>
                  {selectedAsset.width && (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Resolution:</span>
                      <span className="text-[#E0E0E0]">{selectedAsset.width} × {selectedAsset.height}</span>
                    </div>
                  )}
                  {selectedAsset.fps && (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Frame Rate:</span>
                      <span className="text-[#E0E0E0]">{selectedAsset.fps} FPS</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Codec:</span>
                    <span className="text-emerald-400 uppercase">{selectedAsset.codec || 'H.264 / AAC'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Database ID:</span>
                    <span className="text-[#94A3B8] truncate max-w-[120px]">{selectedAsset.id}</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tags & Categories</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAsset.tags.map((t, i) => (
                      <span key={i} className="text-[11px] bg-[#1A1E27] text-[#E0E0E0] px-2 py-0.5 rounded border border-[#2D3139]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      onAddClipToTimeline({
                        trackId: selectedAsset.type === 'audio' || selectedAsset.type === 'sfx' ? 'track_music' : 'track_video_main',
                        assetId: selectedAsset.id,
                        name: selectedAsset.name,
                        type: selectedAsset.type as any,
                        src: selectedAsset.uri,
                        thumbnail: selectedAsset.thumbnail,
                        startTime: currentTime,
                        duration: selectedAsset.duration || 5,
                        trimStart: 0,
                        trimEnd: 0,
                        volume: 1,
                        speed: 1,
                        muted: false,
                        fadeIn: 0.2,
                        fadeOut: 0.2,
                        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                        color: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0 },
                      });
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Insert into Timeline</span>
                  </button>

                  <button
                    onClick={() => handleDelete(selectedAsset.id)}
                    className="w-full py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Asset from Vault</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-[#94A3B8]">
                Select an asset to view metadata & actions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
