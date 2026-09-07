import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Type, 
  Film, 
  Video, 
  Play, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProjectRecord, TimelineClip } from '../types/video';

interface AiStudioViewProps {
  project: ProjectRecord;
  onApplyCaptions: (captions: Array<{ text: string; startTime: number; duration: number }>) => void;
  onAddGeneratedScene: (scene: any) => void;
  onSwitchToEditor: () => void;
}

export const AiStudioView: React.FC<AiStudioViewProps> = ({
  project,
  onApplyCaptions,
  onAddGeneratedScene,
  onSwitchToEditor,
}) => {
  const [topic, setTopic] = useState('How Next-Gen AI Video Editing Works on Apple Silicon');
  const [style, setStyle] = useState('Viral TikTok & Reels Fast Paced');
  const [targetDuration, setTargetDuration] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyboard, setStoryboard] = useState<any>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([]);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const [captionsRes, storyRes] = await Promise.all([
        fetch('/api/ai/captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: topic, duration: targetDuration }),
        }),
        fetch('/api/ai/storyboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, style, targetDuration }),
        }),
      ]);

      if (captionsRes.ok) {
        const cData = await captionsRes.json();
        setGeneratedCaptions(cData.captions || []);
      }
      if (storyRes.ok) {
        const sData = await storyRes.json();
        setStoryboard(sData.storyboard || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#0F1115] overflow-y-auto p-6 select-none custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-[#14171E] border border-[#2D3139] rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">LumenLab AI Video Intelligence</h1>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Automate viral hooks, dynamic animated captions, intelligent scene cutting, and B-roll alignment
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>{isGenerating ? 'Synthesizing Video Plan...' : 'Generate Full AI Storyboard'}</span>
          </button>
        </div>

        {/* Configuration Row */}
        <div className="bg-[#14171E] border border-[#2D3139] rounded-xl p-5 grid grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[#E0E0E0] font-semibold block mb-1">Video Topic / Concept</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[#E0E0E0] font-semibold block mb-1">Editing & Visual Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-[#1A1E27] border border-[#2D3139] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Viral TikTok & Reels Fast Paced" className="bg-[#1A1E27]">Viral TikTok & Reels Fast Paced</option>
              <option value="Cinematic Documentary Master" className="bg-[#1A1E27]">Cinematic Documentary Master</option>
              <option value="Cyberpunk Tech Product Launch" className="bg-[#1A1E27]">Cyberpunk Tech Product Launch</option>
              <option value="Educational Explainer & Clean Subtitles" className="bg-[#1A1E27]">Educational Explainer & Clean Subtitles</option>
            </select>
          </div>

          <div>
            <label className="text-[#E0E0E0] font-semibold block mb-1">Target Duration (Seconds)</label>
            <div className="flex gap-2">
              {[10, 15, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setTargetDuration(d)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    targetDuration === d
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-[#1A1E27] text-[#94A3B8] hover:text-white border border-[#2D3139]'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {storyboard && (
          <div className="grid grid-cols-3 gap-5">
            {/* Storyboard & Hook Column */}
            <div className="col-span-2 bg-[#14171E] border border-[#2D3139] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{storyboard.title}</h3>
                  <div className="text-xs text-indigo-400 font-mono mt-0.5">BPM Suggestion: {storyboard.recommendedMusicBpm || 120} BPM</div>
                </div>
                <button
                  onClick={onSwitchToEditor}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <span>Open in Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hook */}
              <div className="p-3.5 bg-[#1A1E27] border border-amber-500/30 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">🔥 First 3-Second Retention Hook</div>
                <div className="text-sm font-bold text-white tracking-wide">"{storyboard.hook}"</div>
              </div>

              {/* Scene Breakdown */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Automated Scene Breakdown</span>
                {storyboard.scenes?.map((scene: any, idx: number) => (
                  <div key={idx} className="p-3 bg-[#1A1E27] border border-[#2D3139] rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-indigo-400">SCENE #{scene.sceneNumber || idx + 1}</span>
                      <span className="text-[#94A3B8] bg-black/40 px-2 py-0.5 rounded">{scene.time}</span>
                    </div>
                    <div className="text-xs text-white font-medium">🎬 <strong>Visual:</strong> {scene.visual}</div>
                    <div className="text-xs text-[#94A3B8]">🔊 <strong>Audio & SFX:</strong> {scene.audio}</div>
                    <div className="text-xs text-amber-300 font-semibold">💬 <strong>CapCut Subtitle:</strong> "{scene.caption}"</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Captions & Tags Column */}
            <div className="bg-[#14171E] border border-[#2D3139] rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#E0E0E0] uppercase tracking-wider">Generated Captions</h3>
                  <button
                    onClick={() => {
                      onApplyCaptions(generatedCaptions);
                      onSwitchToEditor();
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Apply to Tracks</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {generatedCaptions.map((cap, i) => (
                    <div key={i} className="p-2.5 bg-[#1A1E27] border border-[#2D3139] rounded-lg">
                      <div className="text-xs font-bold text-white">"{cap.text}"</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-1">
                        {cap.startTime.toFixed(1)}s - {(cap.startTime + cap.duration).toFixed(1)}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested B-Roll */}
              <div>
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-2">Recommended B-Roll Vault Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {storyboard.suggestedBrollTags?.map((tag: string, i: number) => (
                    <span key={i} className="text-xs bg-[#1A1E27] text-[#E0E0E0] px-2.5 py-1 rounded-lg border border-[#2D3139]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
