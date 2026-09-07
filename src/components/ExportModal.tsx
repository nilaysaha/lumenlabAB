import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Terminal, 
  Cpu, 
  Check, 
  Copy, 
  X, 
  Sliders, 
  Film, 
  Layers, 
  Apple, 
  Zap,
  Play
} from 'lucide-react';
import { ProjectRecord, ExportSettings, RenderJob } from '../types/video';
import { FFmpegClientService } from '../services/ffmpegClient';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRecord;
  onJobStarted: (job: RenderJob) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onJobStarted,
}) => {
  const [format, setFormat] = useState<'mp4' | 'mov' | 'webm' | 'gif'>('mp4');
  const [fps, setFps] = useState<number>(project.fps || 30);
  const [codec, setCodec] = useState<'h264_videotoolbox' | 'libx264' | 'hevc_videotoolbox' | 'prores_ks'>('h264_videotoolbox');
  const [bitrateKbps, setBitrateKbps] = useState<number>(12000); // 12 Mbps
  const [audioBitrateKbps, setAudioBitrateKbps] = useState<number>(320);
  const [qualityPreset, setQualityPreset] = useState<'fast' | 'medium' | 'slow'>('fast');
  const [hardwareAccelerated, setHardwareAccelerated] = useState<boolean>(true);
  const [generatedCommand, setGeneratedCommand] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    updateCommandPreview();
  }, [isOpen, format, fps, codec, bitrateKbps, audioBitrateKbps, qualityPreset, hardwareAccelerated]);

  const updateCommandPreview = async () => {
    const settings: ExportSettings = {
      format,
      resolution: {
        width: project.resolution.width,
        height: project.resolution.height,
        label: project.resolution.label,
      },
      fps,
      codec: codec as any,
      bitrateKbps,
      audioBitrateKbps,
      qualityPreset,
      hardwareAccelerated,
    };

    const res = await FFmpegClientService.buildCommand(project, settings);
    setGeneratedCommand(res.command);
  };

  const handleStartExport = async () => {
    setIsSubmitting(true);
    const settings: ExportSettings = {
      format,
      resolution: {
        width: project.resolution.width,
        height: project.resolution.height,
        label: project.resolution.label,
      },
      fps,
      codec: codec as any,
      bitrateKbps,
      audioBitrateKbps,
      qualityPreset,
      hardwareAccelerated,
    };

    try {
      const job = await FFmpegClientService.triggerRender(project, settings);
      onJobStarted(job);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#14171E] border border-[#2D3139] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2D3139] flex items-center justify-between bg-[#101218]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Video (FFmpeg Processing Pipeline)</h3>
              <p className="text-xs text-[#94A3B8]">Native VideoToolbox hardware encoding & complex filter compositing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {/* Hardware Acceleration Badge */}
          <div className="p-3 bg-[#1A1E27] border border-[#2D3139] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Apple className="w-5 h-5 text-gray-200" />
              <div>
                <div className="text-xs font-semibold text-white">Apple Silicon Hardware Acceleration</div>
                <div className="text-[11px] text-[#94A3B8] font-mono">VideoToolbox h264/HEVC Engine enabled</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hardwareAccelerated}
                onChange={(e) => setHardwareAccelerated(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setFormat('mp4');
                setCodec('h264_videotoolbox');
                setFps(60);
                setBitrateKbps(14000);
              }}
              className="p-2.5 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-lg text-left transition-colors"
            >
              <div className="text-xs font-bold text-white">📱 TikTok / 60 FPS</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">MP4 • 14 Mbps • Smooth</div>
            </button>

            <button
              onClick={() => {
                setFormat('mov');
                setCodec('prores_ks');
                setFps(30);
                setBitrateKbps(25000);
              }}
              className="p-2.5 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-lg text-left transition-colors"
            >
              <div className="text-xs font-bold text-white">🎬 Apple ProRes Master</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">MOV • 422 HQ • Lossless</div>
            </button>

            <button
              onClick={() => {
                setFormat('mp4');
                setCodec('h264_videotoolbox');
                setFps(30);
                setBitrateKbps(8000);
              }}
              className="p-2.5 bg-[#1A1E27] border border-[#2D3139] hover:border-indigo-500 rounded-lg text-left transition-colors"
            >
              <div className="text-xs font-bold text-white">🌐 YouTube / Web Standard</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">MP4 • 8 Mbps • Fast</div>
            </button>
          </div>

          {/* Format & Codec */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#E0E0E0] font-semibold block mb-1">Container Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-md p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="mp4" className="bg-[#1A1E27]">MP4 (.mp4) - Universal Web & Mobile</option>
                <option value="mov" className="bg-[#1A1E27]">QuickTime MOV (.mov) - Apple ProRes</option>
                <option value="webm" className="bg-[#1A1E27]">WebM (.webm) - HTML5 Lightweight</option>
                <option value="gif" className="bg-[#1A1E27]">GIF (.gif) - Animated Loop</option>
              </select>
            </div>

            <div>
              <label className="text-[#E0E0E0] font-semibold block mb-1">Video Codec</label>
              <select
                value={codec}
                onChange={(e) => setCodec(e.target.value as any)}
                className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-md p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="h264_videotoolbox" className="bg-[#1A1E27]">Apple VideoToolbox (Hardware H.264)</option>
                <option value="hevc_videotoolbox" className="bg-[#1A1E27]">Apple VideoToolbox (Hardware H.265/HEVC)</option>
                <option value="libx264" className="bg-[#1A1E27]">libx264 (Software CPU Master)</option>
                <option value="prores_ks" className="bg-[#1A1E27]">Apple ProRes 422 (Broadcast)</option>
              </select>
            </div>
          </div>

          {/* Resolution & Bitrate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[#E0E0E0] font-semibold mb-1">
                <span>Video Bitrate</span>
                <span className="font-mono text-indigo-400">{(bitrateKbps / 1000).toFixed(1)} Mbps</span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="1000"
                value={bitrateKbps}
                onChange={(e) => setBitrateKbps(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#E0E0E0] font-semibold mb-1">
                <span>Audio Bitrate</span>
                <span className="font-mono text-indigo-400">{audioBitrateKbps} kbps AAC</span>
              </div>
              <div className="flex gap-2">
                {[128, 192, 256, 320].map((b) => (
                  <button
                    key={b}
                    onClick={() => setAudioBitrateKbps(b)}
                    className={`flex-1 py-1 rounded text-xs font-mono ${
                      audioBitrateKbps === b ? 'bg-indigo-600 text-white font-bold' : 'bg-[#1A1E27] text-[#94A3B8] hover:text-white border border-[#2D3139]'
                    }`}
                  >
                    {b}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compiled FFmpeg CLI Command */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Compiled FFmpeg Shell Command
              </span>
              <button
                onClick={copyCommand}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy CLI'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#0B0D11] border border-[#2D3139] rounded-lg text-[#E0E0E0] font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-24 custom-scrollbar">
              {generatedCommand}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2D3139] bg-[#101218] flex items-center justify-between">
          <div className="text-[11px] text-[#94A3B8] font-mono">
            Est. Size: ~{((bitrateKbps * project.duration) / 8000).toFixed(1)} MB
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-md shadow-md shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Start Export Queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
