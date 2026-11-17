import { AspectRatio, Clip, MediaAsset, Track } from '@/types/editor';

class CanvasCompositor {
  private videoCache = new Map<string, HTMLVideoElement>();
  private imageCache = new Map<string, HTMLImageElement>();

  public getOrCreateVideo(asset: MediaAsset): HTMLVideoElement {
    let video = this.videoCache.get(asset.id);
    if (!video) {
      video = document.createElement('video');
      video.src = asset.url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      this.videoCache.set(asset.id, video);
    }
    return video;
  }

  public getOrCreateImage(asset: MediaAsset): HTMLImageElement {
    let img = this.imageCache.get(asset.id);
    if (!img) {
      img = new Image();
      img.src = asset.url;
      this.imageCache.set(asset.id, img);
    }
    return img;
  }

  public render(
    canvas: HTMLCanvasElement,
    playhead: number,
    aspect: AspectRatio,
    tracks: Track[],
    clips: Clip[],
    assets: MediaAsset[]
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas logical resolution based on aspect ratio
    const { width, height } = this.getDimensions(aspect);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 1. Clear background
    ctx.fillStyle = '#090b0e';
    ctx.fillRect(0, 0, width, height);

    // 2. Filter visible tracks
    const visibleTrackIds = new Set(tracks.filter((t) => t.isVisible !== false).map((t) => t.id));

    // 3. Find active clips at current playhead time
    const activeClips = clips.filter((clip) => {
      if (!visibleTrackIds.has(clip.trackId)) return false;
      return playhead >= clip.start && playhead < clip.start + clip.duration;
    });

    // 4. Sort clips by track order (tracks array order defines layer stack)
    const trackOrderMap = new Map(tracks.map((t, idx) => [t.id, idx]));
    activeClips.sort((a, b) => {
      const orderA = trackOrderMap.get(a.trackId) ?? 0;
      const orderB = trackOrderMap.get(b.trackId) ?? 0;
      return orderB - orderA; // Text track (index 0) drawn on top of Video track (index 1)
    });

    // 5. Draw each active clip
    for (const clip of activeClips) {
      const asset = assets.find((a) => a.id === clip.assetId);
      const relativeTime = clip.trimStart + (playhead - clip.start);

      ctx.save();

      // Apply transform (relative to center of canvas)
      const centerX = width / 2 + clip.transform.x;
      const centerY = height / 2 + clip.transform.y;

      ctx.translate(centerX, centerY);
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);
      ctx.scale(clip.transform.scale, clip.transform.scale);
      ctx.globalAlpha = clip.transform.opacity;

      if (clip.type === 'video' && asset) {
        const video = this.getOrCreateVideo(asset);
        // Sync video frame to relative playback time
        if (Math.abs(video.currentTime - relativeTime) > 0.05) {
          video.currentTime = relativeTime;
        }

        const vWidth = asset.width || 1280;
        const vHeight = asset.height || 720;
        // Fit within canvas keeping aspect
        const scale = Math.min(width / vWidth, height / vHeight);
        const dw = vWidth * scale;
        const dh = vHeight * scale;

        ctx.drawImage(video, -dw / 2, -dh / 2, dw, dh);
      } else if (clip.type === 'image' && asset) {
        const img = this.getOrCreateImage(asset);
        const iWidth = asset.width || img.width || 800;
        const iHeight = asset.height || img.height || 600;
        const scale = Math.min(width / iWidth, height / iHeight);
        const dw = iWidth * scale;
        const dh = iHeight * scale;

        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      } else if (clip.type === 'text') {
        const text = clip.text || 'Sample Text';
        const fontSize = clip.fontSize || 48;
        ctx.font = `bold ${fontSize}px ${clip.fontFamily || 'Inter, system-ui'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Optional background badge
        if (clip.backgroundColor && clip.backgroundColor !== 'transparent') {
          const metrics = ctx.measureText(text);
          const padding = 16;
          const bgW = metrics.width + padding * 2;
          const bgH = fontSize + padding;
          ctx.fillStyle = clip.backgroundColor;
          ctx.fillRect(-bgW / 2, -bgH / 2, bgW, bgH);
        }

        ctx.fillStyle = clip.fontColor || '#ffffff';
        ctx.fillText(text, 0, 0);
      }

      ctx.restore();
    }
  }

  public getDimensions(aspect: AspectRatio): { width: number; height: number } {
    switch (aspect) {
      case '9:16':
        return { width: 720, height: 1280 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '16:9':
      default:
        return { width: 1280, height: 720 };
    }
  }

  public cleanup() {
    this.videoCache.forEach((v) => {
      v.pause();
      v.src = '';
      v.load();
    });
    this.videoCache.clear();
    this.imageCache.clear();
  }
}

export const compositor = new CanvasCompositor();
