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
    assets: MediaAsset[],
    showGrid = false
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = this.getDimensions(aspect);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 1. Dark letterbox background
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, width, height);

    // 2. Filter visible tracks
    const visibleTrackIds = new Set(tracks.filter((t) => t.isVisible !== false).map((t) => t.id));

    // 3. Find active clips at current playhead time
    const activeClips = clips.filter((clip) => {
      if (!visibleTrackIds.has(clip.trackId)) return false;
      return playhead >= clip.start && playhead < clip.start + clip.duration;
    });

    // 4. Sort clips: bottom tracks first, top tracks last
    const trackOrderMap = new Map(tracks.map((t, idx) => [t.id, idx]));
    activeClips.sort((a, b) => {
      const orderA = trackOrderMap.get(a.trackId) ?? 0;
      const orderB = trackOrderMap.get(b.trackId) ?? 0;
      return orderB - orderA;
    });

    // 5. Draw each clip
    for (const clip of activeClips) {
      const asset = assets.find((a) => a.id === clip.assetId);
      const relativeTime = clip.trimStart + (playhead - clip.start);

      ctx.save();

      // Blend Mode
      if (clip.blendMode) {
        ctx.globalCompositeOperation = clip.blendMode;
      }

      // Color Filter (CSS filters on canvas context)
      if (clip.filter) {
        const { brightness, contrast, saturation, blur } = clip.filter;
        ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
      }

      // Transform (offset from center)
      const centerX = width / 2 + clip.transform.x;
      const centerY = height / 2 + clip.transform.y;

      ctx.translate(centerX, centerY);
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);
      ctx.scale(clip.transform.scale, clip.transform.scale);
      ctx.globalAlpha = clip.transform.opacity;

      if (clip.type === 'video' && asset) {
        const video = this.getOrCreateVideo(asset);
        if (Math.abs(video.currentTime - relativeTime) > 0.04) {
          video.currentTime = relativeTime;
        }

        const vWidth = asset.width || 1280;
        const vHeight = asset.height || 720;
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
        const text = clip.text || 'FreeCut';
        const fontSize = clip.fontSize || 54;
        ctx.font = `bold ${fontSize}px ${clip.fontFamily || 'Inter, system-ui'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (clip.backgroundColor && clip.backgroundColor !== 'transparent') {
          const metrics = ctx.measureText(text);
          const padding = 20;
          const bgW = metrics.width + padding * 2;
          const bgH = fontSize + padding;
          ctx.fillStyle = clip.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, 12);
          ctx.fill();
        }

        // Text shadow for legibility
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = clip.fontColor || '#ffffff';
        ctx.fillText(text, 0, 0);
      }

      ctx.restore();
    }

    // 6. Optional Rule of Thirds / Safe Areas Grid
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);

      // Thirds
      const x1 = width / 3;
      const x2 = (width * 2) / 3;
      const y1 = height / 3;
      const y2 = (height * 2) / 3;

      ctx.beginPath();
      ctx.moveTo(x1, 0); ctx.lineTo(x1, height);
      ctx.moveTo(x2, 0); ctx.lineTo(x2, height);
      ctx.moveTo(0, y1); ctx.lineTo(width, y1);
      ctx.moveTo(0, y2); ctx.lineTo(width, y2);
      ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 16, height / 2); ctx.lineTo(width / 2 + 16, height / 2);
      ctx.moveTo(width / 2, height / 2 - 16); ctx.lineTo(width / 2, height / 2 + 16);
      ctx.stroke();

      ctx.restore();
    }
  }

  public getDimensions(aspect: AspectRatio): { width: number; height: number } {
    switch (aspect) {
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      case '21:9':
        return { width: 2560, height: 1080 };
      case '16:9':
      default:
        return { width: 1920, height: 1080 };
    }
  }
}

export const compositor = new CanvasCompositor();
