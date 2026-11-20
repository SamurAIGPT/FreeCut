import { MediaAsset } from '@/types/editor';
import { mediaStorage } from '@/services/storage/mediaStorage';

/**
 * Extracts metadata and thumbnail for a single File and returns a MediaAsset.
 */
export async function importMediaFile(file: File): Promise<MediaAsset> {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video');
  const isAudio = file.type.startsWith('audio');
  const id = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  if (isVideo) {
    return new Promise<MediaAsset>((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      let resolved = false;
      const finalize = async (thumbnailUrl?: string) => {
        if (resolved) return;
        resolved = true;
        try {
          await mediaStorage.saveMedia(id, file.name, file.type, file, thumbnailUrl);
        } catch {
          // ignore
        }
        resolve({
          id,
          name: file.name,
          type: 'video',
          url,
          duration: video.duration || 5,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          thumbnailUrl,
        });
      };

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(320, video.videoWidth || 320);
          canvas.height = Math.min(180, video.videoHeight || 180);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumb = canvas.toDataURL('image/jpeg', 0.85);
            finalize(thumb);
            return;
          }
        } catch {
          // Canvas snapshot fallback
        }
        finalize();
      };

      video.onerror = () => finalize();
      setTimeout(() => finalize(), 1500); // Safety timeout
    });
  }

  if (isAudio) {
    return new Promise<MediaAsset>((resolve) => {
      const audio = new Audio(url);
      const finalizeAudio = async (duration = 5) => {
        try {
          await mediaStorage.saveMedia(id, file.name, file.type, file);
        } catch {
          // ignore
        }
        resolve({
          id,
          name: file.name,
          type: 'audio',
          url,
          duration,
        });
      };
      audio.onloadedmetadata = () => finalizeAudio(audio.duration || 5);
      audio.onerror = () => finalizeAudio(5);
      setTimeout(() => finalizeAudio(5), 1500);
    });
  }

  // Otherwise assume image - encode to persistent base64 dataUrl so it survives refreshes
  return new Promise<MediaAsset>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        try {
          await mediaStorage.saveMedia(id, file.name, file.type, file, dataUrl);
        } catch {
          // ignore
        }
        resolve({
          id,
          name: file.name,
          type: 'image',
          url: dataUrl,
          duration: 4,
          width: img.width,
          height: img.height,
          thumbnailUrl: dataUrl,
        });
      };
      img.onerror = async () => {
        try {
          await mediaStorage.saveMedia(id, file.name, file.type, file, dataUrl);
        } catch {
          // ignore
        }
        resolve({
          id,
          name: file.name,
          type: 'image',
          url: dataUrl,
          duration: 4,
          width: 1920,
          height: 1080,
          thumbnailUrl: dataUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      // Fallback to object URL if FileReader fails
      resolve({
        id,
        name: file.name,
        type: 'image',
        url,
        duration: 4,
        width: 1920,
        height: 1080,
        thumbnailUrl: url,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Imports multiple files in parallel and returns array of MediaAssets.
 */
export async function importMediaFiles(files: FileList | File[]): Promise<MediaAsset[]> {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map((f) => importMediaFile(f)));
}
