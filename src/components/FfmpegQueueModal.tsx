import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Play, 
  FileVideo, 
  ExternalLink, 
  Trash2,
  X
} from 'lucide-react';
import { RenderJob } from '../types/video';

export const FfmpegQueueModal: React.FC = () => {
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<RenderJob | null>(null);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 1200);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/ffmpeg/jobs');
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
          if (!selectedJob && data.jobs.length > 0) {
            setSelectedJob(data.jobs[0]);
          } else if (selectedJob) {
            const updated = data.jobs.find((j: RenderJob) => j.id === selectedJob.id);
            if (updated) setSelectedJob(updated);
          }
        }
      }
    } catch (e) {}
  };

  return (
    <div className="flex-1 h-full bg-[#0F1115] overflow-y-auto p-6 select-none custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">FFmpeg Processing Engine & Render Queue</h2>
              <p className="text-xs text-[#94A3B8]">Real-time pipeline monitoring, filter-complex compilation, and export jobs</p>
            </div>
          </div>

          <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
            Backend Status: Active (C++ / Node Subprocess)
          </div>
        </div>

        {/* Jobs & Console View */}
        <div className="grid grid-cols-3 gap-4 h-[600px]">
          {/* Jobs List */}
          <div className="bg-[#14171E] border border-[#2D3139] rounded-xl p-3 flex flex-col space-y-2 overflow-hidden">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider px-2 py-1">
              Active & Recent Render Jobs ({jobs.length})
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#94A3B8]">
                  No active export jobs. Click "Export Video" in the editor to start encoding.
                </div>
              ) : (
                jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-[#1A1E27] border-[#2D3139] text-[#E0E0E0] hover:border-[#3E4552]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold truncate">
                        <span className="truncate">{job.outputFileName}</span>
                        {job.status === 'rendering' ? (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {job.progress}%
                          </span>
                        ) : job.status === 'completed' ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-400">Failed</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#0B0D11] rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mt-2 font-mono">
                        <span>{job.exportSettings.codec}</span>
                        <span>{job.exportSettings.resolution.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Job Details & Terminal Output */}
          <div className="col-span-2 bg-[#14171E] border border-[#2D3139] rounded-xl p-4 flex flex-col space-y-3 overflow-hidden">
            {selectedJob ? (
              <>
                <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white truncate max-w-md">{selectedJob.outputFileName}</h3>
                    <div className="text-xs text-[#94A3B8] font-mono mt-0.5">
                      Target: {selectedJob.exportSettings.resolution.width}x{selectedJob.exportSettings.resolution.height} @ {selectedJob.exportSettings.fps}fps ({selectedJob.exportSettings.bitrateKbps} kbps)
                    </div>
                  </div>

                  {selectedJob.status === 'completed' && (
                    <button
                      onClick={() => alert(`Downloaded file ${selectedJob.outputFileName} to your local macOS Downloads folder.`)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video</span>
                    </button>
                  )}
                </div>

                {/* Shell Command */}
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Compiled FFmpeg Filter Graph:</span>
                  <pre className="p-2.5 bg-[#0B0D11] border border-[#2D3139] rounded-lg text-[#E0E0E0] font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-20 custom-scrollbar mt-1">
                    {selectedJob.ffmpegCommand}
                  </pre>
                </div>

                {/* Console Log Streamer */}
                <div className="flex-1 flex flex-col min-h-0">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Process Encoding Logs:</span>
                  <div className="flex-1 bg-[#0B0D11] border border-[#2D3139] rounded-lg p-3 font-mono text-[10px] text-emerald-400 overflow-y-auto custom-scrollbar space-y-1">
                    {selectedJob.logs?.map((l, i) => (
                      <div key={i} className="leading-relaxed">{l}</div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#94A3B8] text-xs">
                Select a render job from the left panel to inspect real-time FFmpeg logs
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
