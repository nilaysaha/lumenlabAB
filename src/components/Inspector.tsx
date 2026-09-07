import React, { useState } from 'react';
import { 
  Sliders, 
  Move, 
  Volume2, 
  Palette, 
  Type, 
  Sparkles, 
  Key, 
  Gauge, 
  Layers, 
  Eye, 
  Trash2, 
  Copy,
  Scissors
} from 'lucide-react';
import { TimelineClip } from '../types/video';

interface InspectorProps {
  clip: TimelineClip | null;
  onUpdateClip: (updated: TimelineClip) => void;
  onDeleteClip: (id: string) => void;
  onDuplicateClip: (clip: TimelineClip) => void;
  currentTime: number;
}

export const Inspector: React.FC<InspectorProps> = ({
  clip,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  currentTime,
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'color' | 'audio' | 'text' | 'chroma'>('transform');

  if (!clip) {
    return (
      <div className="w-80 h-full bg-[#14171E] border-l border-[#2D3139] flex flex-col items-center justify-center p-6 text-center select-none text-[#94A3B8]">
        <Sliders className="w-10 h-10 text-[#475569] mb-3" />
        <div className="text-sm font-semibold text-[#E0E0E0]">No Clip Selected</div>
        <div className="text-xs text-[#94A3B8] mt-1 max-w-[200px]">
          Click any clip in the timeline or preview canvas to adjust properties, filters, and animations.
        </div>
      </div>
    );
  }

  const isVideoOrImage = clip.type === 'video' || clip.type === 'image' || clip.type === 'adjustment';
  const isAudio = clip.type === 'audio' || clip.type === 'sfx';
  const isText = clip.type === 'text';

  return (
    <div className="w-80 h-full bg-[#14171E] border-l border-[#2D3139] flex flex-col shrink-0 select-none overflow-hidden">
      {/* Clip Header & Quick Actions */}
      <div className="p-3 border-b border-[#2D3139] bg-[#101218] flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-2">
          <div className="text-xs font-semibold text-white truncate">{clip.name}</div>
          <div className="text-[10px] text-[#94A3B8] font-mono flex items-center gap-2">
            <span className="uppercase text-indigo-400 font-bold">{clip.type}</span>
            <span>Duration: {clip.duration.toFixed(2)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateClip(clip)}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
            title="Duplicate Clip (Cmd+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteClip(clip.id)}
            className="p-1.5 rounded-md hover:bg-red-500/20 text-[#94A3B8] hover:text-red-400 transition-colors"
            title="Delete Clip (Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#101218] p-1 gap-1">
        {isVideoOrImage && (
          <button
            onClick={() => setActiveTab('transform')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
              activeTab === 'transform' ? 'bg-[#1F232D] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Move className="w-3 h-3 text-indigo-400" />
            <span>Basic</span>
          </button>
        )}

        {isText && (
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
              activeTab === 'text' ? 'bg-[#1F232D] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Type className="w-3 h-3 text-indigo-400" />
            <span>Text</span>
          </button>
        )}

        {isVideoOrImage && (
          <button
            onClick={() => setActiveTab('color')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
              activeTab === 'color' ? 'bg-[#1F232D] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Palette className="w-3 h-3 text-emerald-400" />
            <span>Color</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
            activeTab === 'audio' ? 'bg-[#1F232D] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <span>Speed & Audio</span>
        </button>

        {isVideoOrImage && (
          <button
            onClick={() => setActiveTab('chroma')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
              activeTab === 'chroma' ? 'bg-[#1F232D] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Cutout</span>
          </button>
        )}
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* TRANSFORM TAB */}
        {activeTab === 'transform' && isVideoOrImage && (
          <div className="space-y-3.5">
            {/* Scale */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Scale</span>
                <span className="font-mono text-indigo-400">{((clip.transform.scale || 1) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={clip.transform.scale || 1}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    transform: { ...clip.transform, scale: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Position X / Y */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Position X (%)</label>
                <input
                  type="number"
                  value={clip.transform.x || 0}
                  onChange={(e) =>
                    onUpdateClip({
                      ...clip,
                      transform: { ...clip.transform, x: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2 py-1 text-white font-mono text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Position Y (%)</label>
                <input
                  type="number"
                  value={clip.transform.y || 0}
                  onChange={(e) =>
                    onUpdateClip({
                      ...clip,
                      transform: { ...clip.transform, y: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2 py-1 text-white font-mono text-xs mt-1"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Rotation</span>
                <span className="font-mono text-indigo-400">{clip.transform.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={clip.transform.rotation || 0}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    transform: { ...clip.transform, rotation: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Opacity</span>
                <span className="font-mono text-indigo-400">{(((clip.transform.opacity ?? 1)) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={clip.transform.opacity ?? 1}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    transform: { ...clip.transform, opacity: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Blend Mode */}
            <div>
              <label className="text-[#E0E0E0] font-medium block mb-1">Blend Mode</label>
              <select
                value={clip.transform.blendMode || 'normal'}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    transform: { ...clip.transform, blendMode: e.target.value as any },
                  })
                }
                className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="screen">Screen (Lighten & Overlays)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="overlay">Overlay (High Contrast)</option>
                <option value="lighter">Add / Lighter</option>
              </select>
            </div>
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && isText && clip.textData && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[#E0E0E0] font-medium block mb-1">Text Content</label>
              <textarea
                value={clip.textData.text}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    textData: { ...clip.textData!, text: e.target.value },
                  })
                }
                rows={2}
                className="w-full bg-[#1A1E27] border border-[#2D3139] rounded p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Font Family</label>
                <select
                  value={clip.textData.fontFamily}
                  onChange={(e) =>
                    onUpdateClip({
                      ...clip,
                      textData: { ...clip.textData!, fontFamily: e.target.value },
                    })
                  }
                  className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2 py-1 text-white text-xs mt-1"
                >
                  <option value="Syne">Syne (Bold Display)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Impact">Impact</option>
                  <option value="sans-serif">System Sans</option>
                </select>
              </div>

              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Font Size (px)</label>
                <input
                  type="number"
                  value={clip.textData.fontSize}
                  onChange={(e) =>
                    onUpdateClip({
                      ...clip,
                      textData: { ...clip.textData!, fontSize: parseInt(e.target.value) || 30 },
                    })
                  }
                  className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2 py-1 text-white font-mono text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Text Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={clip.textData.color}
                    onChange={(e) =>
                      onUpdateClip({
                        ...clip,
                        textData: { ...clip.textData!, color: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-[#2D3139] cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-[#E0E0E0]">{clip.textData.color}</span>
                </div>
              </div>

              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Background Box</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={clip.textData.backgroundColor || '#6366f1'}
                    onChange={(e) =>
                      onUpdateClip({
                        ...clip,
                        textData: { ...clip.textData!, backgroundColor: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-[#2D3139] cursor-pointer bg-transparent"
                  />
                  <button
                    onClick={() =>
                      onUpdateClip({
                        ...clip,
                        textData: { ...clip.textData!, backgroundColor: 'transparent' },
                      })
                    }
                    className="text-[10px] text-[#94A3B8] hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[#E0E0E0] font-medium block mb-1">Entrance Animation</label>
              <select
                value={clip.textData.animation || 'none'}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    textData: { ...clip.textData!, animation: e.target.value as any },
                  })
                }
                className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none"
              >
                <option value="none">None (Static)</option>
                <option value="bounce">CapCut Viral Bounce</option>
                <option value="typewriter">Typewriter</option>
                <option value="slide-up">Slide Up Fade</option>
                <option value="glow-pulse">Glow Pulse</option>
              </select>
            </div>
          </div>
        )}

        {/* COLOR GRADING TAB */}
        {activeTab === 'color' && isVideoOrImage && (
          <div className="space-y-3.5">
            {/* Brightness */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Brightness</span>
                <span className="font-mono text-emerald-400">{clip.color?.brightness || 0}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={clip.color?.brightness || 0}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    color: { ...clip.color, brightness: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Contrast</span>
                <span className="font-mono text-emerald-400">{clip.color?.contrast || 0}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={clip.color?.contrast || 0}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    color: { ...clip.color, contrast: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Saturation</span>
                <span className="font-mono text-emerald-400">{clip.color?.saturation || 0}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={clip.color?.saturation || 0}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    color: { ...clip.color, saturation: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Vignette */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Vignette Edge Falloff</span>
                <span className="font-mono text-emerald-400">{clip.color?.vignette || 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={clip.color?.vignette || 0}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    color: { ...clip.color, vignette: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* AUDIO & SPEED TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-3.5">
            {/* Speed Multiplier */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Playback Speed</span>
                <span className="font-mono text-cyan-400">{(clip.speed || 1).toFixed(1)}x</span>
              </div>
              <div className="flex gap-1 mb-2">
                {[0.5, 1.0, 1.5, 2.0, 4.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateClip({ ...clip, speed: s })}
                    className={`flex-1 py-1 rounded text-xs font-mono font-medium ${
                      clip.speed === s ? 'bg-cyan-600 text-white' : 'bg-[#1A1E27] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                <span>Volume</span>
                <span className="font-mono text-cyan-400">{((clip.volume ?? 1) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={clip.volume ?? 1}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    volume: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Fade In / Out */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Fade In (sec)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={clip.fadeIn || 0}
                  onChange={(e) =>
                    onUpdateClip({
                      ...clip,
                      fadeIn: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2 py-1 text-white font-mono text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-[#94A3B8] text-[10px] uppercase font-bold">Fade Out (sec)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={clip.fadeOut || 0}
                  onChange={(e) =>
                    onUpdateClip({
                      ...clip,
                      fadeOut: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#1A1E27] border border-[#2D3139] rounded px-2 py-1 text-white font-mono text-xs mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* CHROMA KEY TAB */}
        {activeTab === 'chroma' && isVideoOrImage && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[#E0E0E0] font-semibold">Enable Chroma Cutout</span>
              <input
                type="checkbox"
                checked={clip.chromaKey?.enabled || false}
                onChange={(e) =>
                  onUpdateClip({
                    ...clip,
                    chromaKey: {
                      enabled: e.target.checked,
                      color: clip.chromaKey?.color || '#00ff00',
                      similarity: clip.chromaKey?.similarity || 45,
                      smoothness: clip.chromaKey?.smoothness || 15,
                      spillReduction: clip.chromaKey?.spillReduction || 20,
                    },
                  })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {clip.chromaKey?.enabled && (
              <>
                <div>
                  <label className="text-[#E0E0E0] font-medium block mb-1">Key Color (Green Screen)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={clip.chromaKey.color}
                      onChange={(e) =>
                        onUpdateClip({
                          ...clip,
                          chromaKey: { ...clip.chromaKey!, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-[#2D3139] cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-xs text-[#E0E0E0]">{clip.chromaKey.color}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#E0E0E0] font-medium mb-1">
                    <span>Similarity Threshold</span>
                    <span className="font-mono text-amber-400">{clip.chromaKey.similarity}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={clip.chromaKey.similarity}
                    onChange={(e) =>
                      onUpdateClip({
                        ...clip,
                        chromaKey: { ...clip.chromaKey!, similarity: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
