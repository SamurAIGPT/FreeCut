import { AspectRatio, Clip, MediaAsset, Track } from '@/types/editor';
import { compositor } from './compositor';
import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  AudioBufferSource,
  QUALITY_HIGH,
  QUALITY_MEDIUM,
  QUALITY_LOW
} from 'mediabunny';

export interface ExportProgress {
  progress: number; // 0.0 to 1.0
  currentSecond: number;
  totalSeconds: number;
  currentFrame?: number;
  totalFrames?: number;
}

export interface ExportTimelineOptions {
  tracks: Track[];
  clips: Clip[];
  assets: MediaAsset[];
  aspect: AspectRatio;
  duration: number;
  format?: 'webm' | 'mp4';
  resolution?: '1080p' | '720p' | '4k';
  fps?: number;
  quality?: 'high' | 'medium' | 'low';
  includeAudio?: boolean;
  onProgress?: (p: ExportProgress) => void;
}

const QUALITY_MAP = {
  low: QUALITY_LOW,
  medium: QUALITY_MEDIUM,
  high: QUALITY_HIGH,
};

/**
 * Computes high-fidelity target video bitrates matching professional export standards.
 * 4K: 38 Mbps (High), 24 Mbps (Medium), 14 Mbps (Low)
 * 1080p: 16 Mbps (High), 10 Mbps (Medium), 6 Mbps (Low)
 * 720p: 8 Mbps (High), 5 Mbps (Medium), 3 Mbps (Low)
 */
export function computeExportBitrate(
  resolution: '1080p' | '720p' | '4k',
  fps: number = 30,
  quality: 'high' | 'medium' | 'low' = 'high'
): number {
  let baseBitrate: number;
  if (resolution === '4k') {
    baseBitrate = quality === 'high' ? 38_000_000 : quality === 'medium' ? 24_000_000 : 14_000_000;
  } else if (resolution === '720p') {
    baseBitrate = quality === 'high' ? 8_000_000 : quality === 'medium' ? 5_000_000 : 3_000_000;
  } else {
    // 1080p default
    baseBitrate = quality === 'high' ? 16_000_000 : quality === 'medium' ? 10_000_000 : 6_000_000;
  }

  // Motion cadence factor for 60fps or cinematic 24fps
  if (fps >= 60) {
    baseBitrate = Math.round(baseBitrate * 1.35);
  } else if (fps <= 24) {
    baseBitrate = Math.round(baseBitrate * 0.9);
  }

  return baseBitrate;
}

/**
 * Mixes timeline audio tracks into a single AudioBuffer using OfflineAudioContext.
 */
async function mixTimelineAudio(
  clips: Clip[],
  assets: MediaAsset[],
  totalDuration: number
): Promise<AudioBuffer | null> {
  const audioClips = clips.filter((c) => (c.type === 'audio' || c.type === 'video') && !c.isMuted);
  if (audioClips.length === 0) return null;

  try {
    const sampleRate = 44100;
    const totalSamples = Math.max(1, Math.ceil(totalDuration * sampleRate));
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    let hasAudio = false;

    for (const clip of audioClips) {
      const asset = assets.find((a) => a.id === clip.assetId);
      if (!asset?.url) continue;

      try {
        const response = await fetch(asset.url);
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

        const source = offlineCtx.createBufferSource();
        source.buffer = decodedBuffer;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, clip.volume ?? 1));

        source.connect(gainNode);
        gainNode.connect(offlineCtx.destination);

        const startTime = Math.max(0, clip.start);
        const offset = Math.max(0, clip.trimStart || 0);
        const clipDur = Math.min(clip.duration, Math.max(0, decodedBuffer.duration - offset));

        if (clipDur > 0) {
          source.start(startTime, offset, clipDur);
          hasAudio = true;
        }
      } catch {
        // Skip audio decoding if asset is unavailable or purely synthetic
      }
    }

    if (!hasAudio) return null;
    return await offlineCtx.startRendering();
  } catch (err) {
    console.warn('Audio mixing skipped:', err);
    return null;
  }
}

/**
 * Deterministically prepares media (video seeking and image loading) before rendering a frame.
 */
async function prepareFrameAssets(
  playhead: number,
  clips: Clip[],
  assets: MediaAsset[]
): Promise<void> {
  const activeClips = clips.filter((c) => playhead >= c.start && playhead < c.start + c.duration);
  const tasks: Promise<any>[] = [];

  for (const clip of activeClips) {
    const asset = assets.find((a) => a.id === clip.assetId);
    if (!asset) continue;

    if (clip.type === 'video') {
      const video = compositor.getOrCreateVideo(asset);
      const clipSpeed = clip.speed && clip.speed > 0 ? clip.speed : 1;
      const targetTime = clip.trimStart + (playhead - clip.start) * clipSpeed;

      if (Math.abs(video.currentTime - targetTime) > 0.01) {
        tasks.push(
          new Promise<void>((resolve) => {
            let done = false;
            const finish = () => {
              if (!done) {
                done = true;
                video.removeEventListener('seeked', finish);
                video.removeEventListener('error', finish);
                resolve();
              }
            };
            video.addEventListener('seeked', finish);
            video.addEventListener('error', finish);
            video.currentTime = Math.max(0, Math.min(video.duration || 999999, targetTime));
            setTimeout(finish, 80);
          })
        );
      }
    } else if (clip.type === 'image') {
      const img = compositor.getOrCreateImage(asset);
      if (!img.complete || img.naturalWidth === 0) {
        tasks.push(
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 150);
          })
        );
      }
    }
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

/**
 * Deterministically exports the timeline video using mediabunny (WebCodecs & standard container muxers).
 * Each frame is assigned its exact mathematical timestamp (playhead = frame / fps), guaranteeing
 * that the output video file has the exact intended duration and never drifts or stretches.
 */
export async function exportTimelineVideo(
  tracks: Track[],
  clips: Clip[],
  assets: MediaAsset[],
  aspect: AspectRatio,
  duration: number,
  onProgress?: (p: ExportProgress) => void,
  options?: {
    format?: 'webm' | 'mp4';
    resolution?: '1080p' | '720p' | '4k';
    fps?: number;
    quality?: 'high' | 'medium' | 'low';
    includeAudio?: boolean;
  }
): Promise<Blob> {
  const format = options?.format || 'webm';
  const resolution = options?.resolution || '1080p';
  const fps = options?.fps || 30;
  const quality = options?.quality || 'high';
  const includeAudio = options?.includeAudio ?? true;

  // Compute resolution dimensions
  const baseDim = compositor.getDimensions(aspect);
  let scale = 1.0;
  if (resolution === '720p') scale = 720 / 1080;
  else if (resolution === '4k') scale = 2160 / 1080;

  // Dimensions must be even integers for video encoders
  const width = Math.round((baseDim.width * scale) / 2) * 2;
  const height = Math.round((baseDim.height * scale) / 2) * 2;

  const totalFrames = Math.max(1, Math.round(duration * fps));

  // Check if WebCodecs VideoEncoder is available
  if (typeof VideoEncoder !== 'undefined') {
    return await exportWithMediabunny({
      tracks,
      clips,
      assets,
      aspect,
      duration,
      width,
      height,
      fps,
      totalFrames,
      format,
      resolution,
      quality,
      includeAudio,
      onProgress,
    });
  }

  // Fallback for older browsers without WebCodecs
  return await exportWithMediaRecorderFallback({
    tracks,
    clips,
    assets,
    aspect,
    duration,
    width,
    height,
    fps,
    totalFrames,
    resolution,
    quality,
    onProgress,
  });
}

/**
 * Primary export path: Mediabunny muxing with explicit timestamps.
 */
async function exportWithMediabunny(params: {
  tracks: Track[];
  clips: Clip[];
  assets: MediaAsset[];
  aspect: AspectRatio;
  duration: number;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  format: 'webm' | 'mp4';
  resolution: '1080p' | '720p' | '4k';
  quality: 'high' | 'medium' | 'low';
  includeAudio: boolean;
  onProgress?: (p: ExportProgress) => void;
}): Promise<Blob> {
  const {
    tracks,
    clips,
    assets,
    aspect,
    duration,
    width,
    height,
    fps,
    totalFrames,
    format,
    resolution,
    quality,
    includeAudio,
    onProgress,
  } = params;

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  const outputFormat = format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat();
  const target = new BufferTarget();
  const output = new Output({
    format: outputFormat,
    target,
  });

  const targetBitrate = computeExportBitrate(resolution, fps, quality);
  const videoCodec = format === 'mp4' ? 'avc' : 'vp9';
  const videoSource = new CanvasSource(offscreenCanvas, {
    codec: videoCodec,
    bitrate: targetBitrate,
  });

  output.addVideoTrack(videoSource, { frameRate: fps });

  // Audio rendering & mixing
  let audioBuffer: AudioBuffer | null = null;
  let audioSource: AudioBufferSource | null = null;
  if (includeAudio) {
    audioBuffer = await mixTimelineAudio(clips, assets, duration);
    if (audioBuffer) {
      let audioCodec: 'aac' | 'opus' = format === 'webm' ? 'opus' : 'aac';
      if (audioCodec === 'aac' && typeof AudioEncoder !== 'undefined') {
        const { supported } = await AudioEncoder.isConfigSupported({
          codec: 'mp4a.40.2',
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels,
          bitrate: 192000,
        });
        if (!supported) audioCodec = 'opus';
      }

      audioSource = new AudioBufferSource({
        codec: audioCodec,
        bitrate: quality === 'low' ? 96000 : quality === 'medium' ? 128000 : 192000,
      });
      output.addAudioTrack(audioSource);
    }
  }

  await output.start();

  if (audioSource && audioBuffer) {
    await audioSource.add(audioBuffer);
    audioSource.close();
  }

  // Render video frame by frame with exact mathematical timestamps
  for (let frame = 0; frame < totalFrames; frame++) {
    const playhead = frame / fps;
    await prepareFrameAssets(playhead, clips, assets);
    compositor.render(offscreenCanvas, playhead, aspect, tracks, clips, assets, false, { width, height });

    // Exact timestamp in seconds, exact frame duration (1 / fps)
    await videoSource.add(playhead, 1 / fps);

    if (onProgress) {
      onProgress({
        progress: (frame + 1) / totalFrames,
        currentSecond: playhead,
        totalSeconds: duration,
        currentFrame: frame + 1,
        totalFrames,
      });
    }

    // Yield to the event loop every 10 frames to keep the UI interactive
    if (frame % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  videoSource.close();
  await output.finalize();

  const buffer = target.buffer;
  if (!buffer) {
    throw new Error('Failed to generate export video buffer');
  }

  const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
  return new Blob([buffer], { type: mimeType });
}

/**
 * Fallback export path using MediaRecorder without artificial sleep delays.
 */
async function exportWithMediaRecorderFallback(params: {
  tracks: Track[];
  clips: Clip[];
  assets: MediaAsset[];
  aspect: AspectRatio;
  duration: number;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  resolution: '1080p' | '720p' | '4k';
  quality: 'high' | 'medium' | 'low';
  onProgress?: (p: ExportProgress) => void;
}): Promise<Blob> {
  const {
    tracks,
    clips,
    assets,
    aspect,
    duration,
    width,
    height,
    fps,
    totalFrames,
    resolution,
    quality,
    onProgress,
  } = params;

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  const stream = offscreenCanvas.captureStream(fps);

  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const targetBitrate = computeExportBitrate(resolution, fps, quality);

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: targetBitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = (e) => reject(e);

    recorder.start();

    let frame = 0;
    const intervalMs = 1000 / fps;
    const startTime = performance.now();

    const renderNext = async () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const playhead = frame / fps;
      await prepareFrameAssets(playhead, clips, assets);
      compositor.render(offscreenCanvas, playhead, aspect, tracks, clips, assets, false, { width, height });

      if (onProgress) {
        onProgress({
          progress: (frame + 1) / totalFrames,
          currentSecond: playhead,
          totalSeconds: duration,
          currentFrame: frame + 1,
          totalFrames,
        });
      }

      frame++;
      const nextExpected = startTime + frame * intervalMs;
      const delay = Math.max(0, nextExpected - performance.now());
      setTimeout(renderNext, delay);
    };

    renderNext();
  });
}
