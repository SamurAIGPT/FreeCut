import { AspectRatio, Clip, MediaAsset, Track } from '@/types/editor';
import { useEditorStore } from '@/store/useEditorStore';

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

    // 1. Canvas letterbox background (customizable from Settings or default Obsidian Black)
    const canvasBg = useEditorStore.getState().canvasBg;
    ctx.fillStyle = canvasBg || '#000000';
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

      const scaleX = clip.transform.scaleX !== undefined ? clip.transform.scaleX : clip.transform.scale;
      const scaleY = clip.transform.scaleY !== undefined ? clip.transform.scaleY : clip.transform.scale;
      ctx.scale(scaleX, scaleY);
      ctx.globalAlpha = clip.transform.opacity;

      // Masking
      if (clip.mask && clip.mask.type && clip.mask.type !== 'none') {
        const m = clip.mask;
        ctx.beginPath();
        const mx = m.x || 0;
        const my = m.y || 0;
        const mw = m.width || 360;
        const mh = m.height || 240;

        if (m.type === 'rectangle') {
          if (m.inverted) {
            ctx.rect(-width * 2, -height * 2, width * 4, height * 4);
            ctx.roundRect(mx - mw / 2, my - mh / 2, mw, mh, m.radius || 0);
            ctx.clip('evenodd');
          } else {
            ctx.roundRect(mx - mw / 2, my - mh / 2, mw, mh, m.radius || 0);
            ctx.clip();
          }
        } else if (m.type === 'circle' || m.type === 'ellipse') {
          const rx = mw / 2;
          const ry = (m.type === 'circle' ? mw : mh) / 2;
          if (m.inverted) {
            ctx.rect(-width * 2, -height * 2, width * 4, height * 4);
            ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
            ctx.clip('evenodd');
          } else {
            ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
            ctx.clip();
          }
        } else if (m.type === 'split') {
          if (m.inverted) {
            ctx.rect(-width * 2, -height * 2, width * 4, height * 4);
            ctx.rect(-width * 2, my, width * 4, height * 2);
            ctx.clip('evenodd');
          } else {
            ctx.rect(-width * 2, -height * 2, width * 4, height * 2 + my);
            ctx.clip();
          }
        } else if (m.type === 'star') {
          const spikes = 5;
          const outerRadius = mw / 2;
          const innerRadius = outerRadius * 0.45;
          let rot = (Math.PI / 2) * 3;
          const step = Math.PI / spikes;

          if (m.inverted) {
            ctx.rect(-width * 2, -height * 2, width * 4, height * 4);
          }
          ctx.moveTo(mx, my - outerRadius);
          for (let i = 0; i < spikes; i++) {
            let x = mx + Math.cos(rot) * outerRadius;
            let y = my + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = mx + Math.cos(rot) * innerRadius;
            y = my + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(mx, my - outerRadius);
          ctx.closePath();
          if (m.inverted) {
            ctx.clip('evenodd');
          } else {
            ctx.clip();
          }
        } else if (m.type === 'heart') {
          const s = mw / 200;
          if (m.inverted) {
            ctx.rect(-width * 2, -height * 2, width * 4, height * 4);
          }
          ctx.moveTo(mx, my - 30 * s);
          ctx.bezierCurveTo(mx, my - 60 * s, mx - 60 * s, my - 80 * s, mx - 100 * s, my - 40 * s);
          ctx.bezierCurveTo(mx - 150 * s, my + 10 * s, mx - 50 * s, my + 70 * s, mx, my + 110 * s);
          ctx.bezierCurveTo(mx + 50 * s, my + 70 * s, mx + 150 * s, my + 10 * s, mx + 100 * s, my - 40 * s);
          ctx.bezierCurveTo(mx + 60 * s, my - 80 * s, mx, my - 60 * s, mx, my - 30 * s);
          ctx.closePath();
          if (m.inverted) {
            ctx.clip('evenodd');
          } else {
            ctx.clip();
          }
        }
      }

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
