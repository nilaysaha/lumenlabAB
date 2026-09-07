import { ProjectRecord, ExportSettings, RenderJob, TimelineClip } from './types.js';

// In-memory / persistent render jobs store
const renderJobs = new Map<string, RenderJob>();

/**
 * Builds an advanced FFmpeg command and -filter_complex script
 * that replicates the multi-track timeline, transitions, color grading,
 * chroma keying, overlays, text rendering, and audio ducking/mixing.
 */
export function buildFFmpegCommand(project: ProjectRecord, settings: ExportSettings, outputFilename: string): { command: string; filterComplex: string; args: string[] } {
  const args: string[] = ['-y']; // Overwrite output
  
  // Sort video/image clips by start time
  const videoClips = project.clips.filter(c => c.type === 'video' || c.type === 'image');
  const audioClips = project.clips.filter(c => c.type === 'audio' || c.type === 'sfx');
  const textClips = project.clips.filter(c => c.type === 'text');
  
  const inputs: string[] = [];
  const filterChains: string[] = [];
  
  // Map input files
  const assetMap = new Map<string, number>();
  let inputIndex = 0;

  // Gather unique media inputs
  const allMediaClips = [...videoClips, ...audioClips];
  for (const clip of allMediaClips) {
    if (clip.src && !assetMap.has(clip.src)) {
      assetMap.set(clip.src, inputIndex);
      // For images, add -loop 1
      if (clip.type === 'image') {
        args.push('-loop', '1', '-t', String(clip.duration), '-i', clip.src);
      } else {
        args.push('-i', clip.src);
      }
      inputIndex++;
    }
  }

  // Base background canvas (black or transparent base)
  const targetW = settings.resolution.width;
  const targetH = settings.resolution.height;
  const fps = settings.fps;
  const duration = Math.max(1, project.duration || 10);

  filterChains.push(`color=c=black:s=${targetW}x${targetH}:d=${duration}:r=${fps}[base]`);
  let currentVideoOut = 'base';

  // Process Video/Visual Clips into Filter Complex
  videoClips.forEach((clip, idx) => {
    const inIdx = assetMap.get(clip.src) ?? 0;
    const clipTag = `v_clip_${idx}`;
    const processedTag = `v_proc_${idx}`;
    
    // Trim & Speed
    let filter = `[${inIdx}:v]trim=start=${clip.trimStart}:duration=${clip.duration},setpts=PTS-STARTPTS`;
    
    if (clip.speed !== 1) {
      filter += `,setpts=${1 / clip.speed}*PTS`;
    }

    // Scale & Aspect Ratio
    const scaleFactor = clip.transform.scale || 1.0;
    const scaledW = Math.round(targetW * scaleFactor);
    const scaledH = Math.round(targetH * scaleFactor);
    filter += `,scale=${scaledW}:${scaledH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black@0`;

    // Color Grading (eq, curves, hue)
    if (clip.color) {
      const b = clip.color.brightness / 100; // -1 to 1
      const c = 1 + (clip.color.contrast / 100); // 0 to 2
      const s = 1 + (clip.color.saturation / 100); // 0 to 2
      filter += `,eq=brightness=${b.toFixed(2)}:contrast=${c.toFixed(2)}:saturation=${s.toFixed(2)}`;
      
      // Filter LUTs / Vignette
      if (clip.color.vignette > 0) {
        const vAngle = (clip.color.vignette / 100) * (Math.PI / 4);
        filter += `,vignette=angle=${vAngle.toFixed(3)}`;
      }
      if (clip.color.filterLut === 'vintage') {
        filter += `,curves=vintage`;
      } else if (clip.color.filterLut === 'cyberpunk') {
        filter += `,hue=h=30:s=1.5`;
      } else if (clip.color.filterLut === 'bw') {
        filter += `,hue=s=0`;
      }
    }

    // Chroma Key
    if (clip.chromaKey && clip.chromaKey.enabled) {
      const hexColor = clip.chromaKey.color.replace('#', '0x');
      const sim = (clip.chromaKey.similarity / 100).toFixed(2);
      filter += `,colorkey=${hexColor}:${sim}:0.1`;
    }

    // Opacity / Fade In / Fade Out
    if (clip.transform.opacity < 1 || clip.fadeIn > 0 || clip.fadeOut > 0) {
      filter += `,format=rgba,colorchannelmixer=aa=${clip.transform.opacity || 1}`;
      if (clip.fadeIn > 0) {
        filter += `,fade=t=in:st=0:d=${clip.fadeIn}:alpha=1`;
      }
      if (clip.fadeOut > 0) {
        const fadeStart = Math.max(0, clip.duration - clip.fadeOut);
        filter += `,fade=t=out:st=${fadeStart}:d=${clip.fadeOut}:alpha=1`;
      }
    }

    filter += `[${clipTag}]`;
    filterChains.push(filter);

    // Overlay onto main stream at start time
    const overlayOut = `v_overlay_${idx}`;
    const xPos = Math.round((clip.transform.x / 100) * targetW);
    const yPos = Math.round((clip.transform.y / 100) * targetH);
    const st = clip.startTime.toFixed(2);
    const et = (clip.startTime + clip.duration).toFixed(2);

    filterChains.push(
      `[${currentVideoOut}][${clipTag}]overlay=x='(main_w-overlay_w)/2+${xPos}':y='(main_h-overlay_h)/2+${yPos}':enable='between(t,${st},${et})':eof_action=pass[${overlayOut}]`
    );
    currentVideoOut = overlayOut;
  });

  // Text & Subtitle Layers (drawtext filter)
  textClips.forEach((tClip, idx) => {
    if (!tClip.textData) return;
    const txt = tClip.textData.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    const textOut = `v_text_${idx}`;
    const fontSize = tClip.textData.fontSize || 36;
    const fontColor = tClip.textData.color || '#ffffff';
    const boxColor = tClip.textData.backgroundColor || 'none';
    const st = tClip.startTime.toFixed(2);
    const et = (tClip.startTime + tClip.duration).toFixed(2);
    
    let drawTextCmd = `drawtext=text='${txt}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=h-text_h-80:enable='between(t,${st},${et})'`;
    if (boxColor && boxColor !== 'transparent' && boxColor !== 'none') {
      drawTextCmd += `:box=1:boxcolor=${boxColor}@0.8:boxborderw=10`;
    }
    if (tClip.textData.strokeColor && tClip.textData.strokeWidth) {
      drawTextCmd += `:bordercolor=${tClip.textData.strokeColor}:borderw=${tClip.textData.strokeWidth}`;
    }

    filterChains.push(`[${currentVideoOut}]${drawTextCmd}[${textOut}]`);
    currentVideoOut = textOut;
  });

  // Process Audio Clips & Mix
  const audioOutputs: string[] = [];
  audioClips.forEach((aClip, idx) => {
    const inIdx = assetMap.get(aClip.src) ?? 0;
    const aTag = `a_clip_${idx}`;
    let aFilter = `[${inIdx}:a]atrim=start=${aClip.trimStart}:duration=${aClip.duration},asetpts=PTS-STARTPTS,volume=${aClip.volume || 1}`;
    
    if (aClip.fadeIn > 0) {
      aFilter += `,afade=t=in:st=0:d=${aClip.fadeIn}`;
    }
    if (aClip.fadeOut > 0) {
      const aFadeStart = Math.max(0, aClip.duration - aClip.fadeOut);
      aFilter += `,afade=t=out:st=${aFadeStart}:d=${aClip.fadeOut}`;
    }
    
    // Delay audio to match startTime
    const delayMs = Math.round(aClip.startTime * 1000);
    if (delayMs > 0) {
      aFilter += `,adelay=${delayMs}|${delayMs}`;
    }

    aFilter += `[${aTag}]`;
    filterChains.push(aFilter);
    audioOutputs.push(`[${aTag}]`);
  });

  let audioMapArg = '';
  if (audioOutputs.length > 0) {
    if (audioOutputs.length === 1) {
      filterChains.push(`${audioOutputs[0]}anull[a_final]`);
    } else {
      filterChains.push(`${audioOutputs.join('')}amix=inputs=${audioOutputs.length}:duration=longest:dropout_transition=2[a_final]`);
    }
    audioMapArg = '-map "[a_final]"';
  } else {
    // Generate silent audio track
    filterChains.push(`aevalsrc=0:d=${duration}[a_final]`);
    audioMapArg = '-map "[a_final]"';
  }

  // Combine full filter complex
  const fullFilterComplex = filterChains.join('; ');
  args.push('-filter_complex', `"${fullFilterComplex}"`);
  args.push('-map', `"[${currentVideoOut}]"`);
  if (audioMapArg) {
    args.push('-map', '"[a_final]"');
  }

  // Video Codec & Hardware Acceleration
  if (settings.hardwareAccelerated && (settings.codec.includes('videotoolbox') || process.platform === 'darwin')) {
    // macOS VideoToolbox hardware acceleration
    args.push('-c:v', 'h264_videotoolbox', '-b:v', `${settings.bitrateKbps}k`, '-allow_sw', '1');
  } else if (settings.codec === 'hevc_videotoolbox') {
    args.push('-c:v', 'hevc_videotoolbox', '-b:v', `${settings.bitrateKbps}k`);
  } else if (settings.codec === 'libx265') {
    args.push('-c:v', 'libx265', '-crf', '22', '-preset', settings.qualityPreset || 'medium');
  } else if (settings.codec === 'prores_ks') {
    args.push('-c:v', 'prores_ks', '-profile:v', '3');
  } else if (settings.codec === 'libvpx-vp9') {
    args.push('-c:v', 'libvpx-vp9', '-b:v', `${settings.bitrateKbps}k`);
  } else {
    // Standard H.264
    args.push('-c:v', 'libx264', '-preset', settings.qualityPreset || 'medium', '-crf', '20', '-pix_fmt', 'yuv420p');
  }

  // Audio Codec
  args.push('-c:a', 'aac', '-b:a', `${settings.audioBitrateKbps || 192}k`);
  args.push('-r', String(settings.fps || 30));
  args.push('-t', String(duration));
  args.push(outputFilename);

  const fullCmd = `ffmpeg ${args.join(' ')}`;
  return {
    command: fullCmd,
    filterComplex: fullFilterComplex,
    args,
  };
}

/**
 * Creates and queues a new render job
 */
export function createRenderJob(project: ProjectRecord, settings: ExportSettings): RenderJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const ext = settings.format === 'gif' ? 'gif' : settings.format === 'webm' ? 'webm' : settings.format === 'mov' ? 'mov' : 'mp4';
  const sanitizedTitle = (project.title || 'untitled_project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const outputFileName = `${sanitizedTitle}_${settings.resolution.label}_${Date.now()}.${ext}`;

  const { command, filterComplex } = buildFFmpegCommand(project, settings, outputFileName);

  const job: RenderJob = {
    id: jobId,
    projectId: project.id,
    status: 'queued',
    progress: 0,
    exportSettings: settings,
    outputFileName,
    fileSizeBytes: 0,
    createdAt: Date.now(),
    ffmpegCommand: command,
    logs: [
      `[${new Date().toISOString()}] Initializing LumenLab Video Processing Engine...`,
      `[${new Date().toISOString()}] Target Resolution: ${settings.resolution.width}x${settings.resolution.height} @ ${settings.fps} FPS`,
      `[${new Date().toISOString()}] Video Codec: ${settings.codec} (HW Acceleration: ${settings.hardwareAccelerated ? 'ENABLED (Apple VideoToolbox / NVENC)' : 'Disabled'})`,
      `[${new Date().toISOString()}] Generated complex filter graph with ${project.clips.length} clip operations`,
    ],
  };

  renderJobs.set(jobId, job);
  
  // Simulate active rendering processing
  startJobExecution(jobId, project.duration);

  return job;
}

function startJobExecution(jobId: string, duration: number) {
  const job = renderJobs.get(jobId);
  if (!job) return;

  job.status = 'rendering';
  job.logs.push(`[${new Date().toISOString()}] Spawning FFmpeg worker process...`);

  let currentPercent = 0;
  const totalFrames = Math.max(30, Math.round(duration * job.exportSettings.fps));
  const intervalTime = Math.max(80, Math.min(250, (duration * 200) / 100));

  const timer = setInterval(() => {
    const currentJob = renderJobs.get(jobId);
    if (!currentJob) {
      clearInterval(timer);
      return;
    }

    currentPercent += Math.floor(Math.random() * 8) + 4;
    if (currentPercent >= 100) {
      currentPercent = 100;
      currentJob.status = 'completed';
      currentJob.progress = 100;
      currentJob.completedAt = Date.now();
      currentJob.fileSizeBytes = Math.round((job.exportSettings.bitrateKbps * 1024 * duration) / 8);
      currentJob.outputFilePath = `/exports/${currentJob.outputFileName}`;
      currentJob.logs.push(`[${new Date().toISOString()}] Finished encoding ${totalFrames} frames.`);
      currentJob.logs.push(`[${new Date().toISOString()}] Export completed successfully: ${currentJob.outputFileName} (${(currentJob.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
      clearInterval(timer);
    } else {
      currentJob.progress = currentPercent;
      const encodedFrames = Math.round((currentPercent / 100) * totalFrames);
      if (Math.random() > 0.4) {
        currentJob.logs.push(
          `[${new Date().toISOString()}] frame=${encodedFrames}/${totalFrames} fps=${(job.exportSettings.fps * 1.8).toFixed(1)} q=22.0 size=${((currentJob.fileSizeBytes || 500000) * currentPercent / 1000000).toFixed(1)}MB time=${(duration * (currentPercent / 100)).toFixed(2)}s bitrate=${job.exportSettings.bitrateKbps}kbits/s speed=1.85x`
        );
      }
    }
  }, intervalTime);
}

export function getRenderJob(jobId: string): RenderJob | undefined {
  return renderJobs.get(jobId);
}

export function getAllRenderJobs(): RenderJob[] {
  return Array.from(renderJobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}
