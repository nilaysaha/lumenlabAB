import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Type, 
  Film, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  X,
  Play
} from 'lucide-react';
import { TimelineClip } from '../types/video';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCaptions: (captions: Array<{ text: string; startTime: number; duration: number }>) => void;
  videoDuration: number;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyCaptions,
  videoDuration,
}) => {
  const [activeAiTab, setActiveAiTab] = useState<'captions' | 'storyboard' | 'reframe'>('captions');
  const [prompt, setPrompt] = useState('Viral TikTok about futuristic AI desktop video editing tools');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<Array<{ text: string; startTime: number; duration: number }>>([]);
  const [storyboard, setStoryboard] = useState<any>(null);

  if (!isOpen) return null;

  const handleGenerateCaptions = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: videoDuration }),
      });
      const data = await res.json();
      if (data.captions) {
        setGeneratedCaptions(data.captions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: prompt, style: 'Fast Paced CapCut Viral', targetDuration: videoDuration }),
      });
      const data = await res.json();
      if (data.storyboard) {
        setStoryboard(data.storyboard);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#14171E] border border-[#2D3139] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2D3139] flex items-center justify-between bg-[#101218]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">LumenLab AI Studio Suite</h3>
              <p className="text-xs text-[#94A3B8]">Powered by Gemini 3.8 Flash for high-retention video creation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1F232D] text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Modes Tabs */}
        <div className="flex border-b border-[#2D3139] bg-[#101218] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveAiTab('captions')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeAiTab === 'captions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>AI Auto-Captions & Subtitles</span>
          </button>

          <button
            onClick={() => setActiveAiTab('storyboard')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeAiTab === 'storyboard'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Script & Storyboard Generator</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          <div>
            <label className="text-[#E0E0E0] font-semibold block mb-1.5">
              {activeAiTab === 'captions' ? 'Video Topic / Speech Context' : 'Video Theme & Target Hook'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="e.g., 5 AI Video Tools That Feel Like Magic in 2026..."
              className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-lg p-3 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* CAPTIONS VIEW */}
          {activeAiTab === 'captions' && (
            <div className="space-y-3">
              <button
                onClick={handleGenerateCaptions}
                disabled={isGenerating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'Generating Dynamic Subtitles...' : 'Generate Auto-Captions'}</span>
              </button>

              {generatedCaptions.length > 0 && (
                <div className="space-y-2 mt-4 bg-[#101218] p-3 rounded-lg border border-[#2D3139]">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#E0E0E0]">
                    <span>Generated Subtitle Segments ({generatedCaptions.length})</span>
                    <button
                      onClick={() => {
                        onApplyCaptions(generatedCaptions);
                        onClose();
                      }}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply to Timeline</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {generatedCaptions.map((cap, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-[#1A1E27] rounded border border-[#2D3139] flex items-center justify-between"
                      >
                        <span className="font-semibold text-white tracking-wide">"{cap.text}"</span>
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {cap.startTime.toFixed(1)}s - {(cap.startTime + cap.duration).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STORYBOARD VIEW */}
          {activeAiTab === 'storyboard' && (
            <div className="space-y-3">
              <button
                onClick={handleGenerateStoryboard}
                disabled={isGenerating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>{isGenerating ? 'Structuring Storyboard...' : 'Generate Viral Storyboard'}</span>
              </button>

              {storyboard && (
                <div className="space-y-3 bg-[#101218] p-4 rounded-lg border border-[#2D3139]">
                  <div className="text-sm font-bold text-white">{storyboard.title}</div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200">
                    <span className="font-bold">⚡ Viral Hook: </span>
                    {storyboard.hook}
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Scene Breakdown</span>
                    {storyboard.scenes?.map((scene: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-[#1A1E27] rounded border border-[#2D3139] space-y-1">
                        <div className="flex justify-between font-mono text-[10px] text-indigo-400">
                          <span>SCENE {scene.sceneNumber || idx + 1}</span>
                          <span>{scene.time}</span>
                        </div>
                        <div className="text-gray-200 font-medium">🎬 {scene.visual}</div>
                        <div className="text-[#94A3B8] text-[11px]">🔊 {scene.audio}</div>
                        <div className="text-amber-300 font-semibold text-[11px]">💬 "{scene.caption}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
