import { MediaAsset } from '@/types/editor';

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
      const finalize = (thumbnailUrl?: string) => {
        if (resolved) return;
        resolved = true;
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
      audio.onloadedmetadata = () => {
        resolve({
          id,
          name: file.name,
          type: 'audio',
          url,
          duration: audio.duration || 5,
        });
      };
      audio.onerror = () => {
        resolve({
          id,
          name: file.name,
          type: 'audio',
          url,
          duration: 5,
        });
      };
      setTimeout(() => {
        resolve({
          id,
          name: file.name,
          type: 'audio',
          url,
          duration: 5,
        });
      }, 1500);
    });
  }

  // Otherwise assume image
  return new Promise<MediaAsset>((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve({
        id,
        name: file.name,
        type: 'image',
        url,
        duration: 4,
        width: img.width,
        height: img.height,
        thumbnailUrl: url,
      });
    };
    img.onerror = () => {
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
    setTimeout(() => {
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
    }, 1500);
  });
}

/**
 * Imports multiple files in parallel and returns array of MediaAssets.
 */
export async function importMediaFiles(files: FileList | File[]): Promise<MediaAsset[]> {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map((f) => importMediaFile(f)));
}
