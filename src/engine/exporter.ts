import { AspectRatio, Clip, MediaAsset, Track } from '@/types/editor';
import { compositor } from './compositor';

export interface ExportProgress {
  progress: number; // 0.0 to 1.0
  currentSecond: number;
  totalSeconds: number;
}

export async function exportTimelineVideo(
  tracks: Track[],
  clips: Clip[],
  assets: MediaAsset[],
  aspect: AspectRatio,
  duration: number,
  onProgress?: (p: ExportProgress) => void
): Promise<Blob> {
  const { width, height } = compositor.getDimensions(aspect);
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  const fps = 30;
  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const stream = offscreenCanvas.captureStream(fps);

  // Setup MediaRecorder
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000, // 8 Mbps high quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    recorder.onerror = (e) => reject(e);

    recorder.start();

    // Render frame by frame
    for (let frame = 0; frame < totalFrames; frame++) {
      const playhead = frame / fps;
      compositor.render(offscreenCanvas, playhead, aspect, tracks, clips, assets);

      if (onProgress) {
        onProgress({
          progress: frame / totalFrames,
          currentSecond: playhead,
          totalSeconds: duration,
        });
      }

      // Small delay to allow the recorder to encode the frame
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
  });
}
