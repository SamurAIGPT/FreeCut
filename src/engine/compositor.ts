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

      // Speed multiplier
      const clipSpeed = clip.speed && clip.speed > 0 ? clip.speed : 1;
      const relativeTime = clip.trimStart + (playhead - clip.start) * clipSpeed;

      ctx.save();

      // Blend Mode
      if (clip.blendMode) {
        ctx.globalCompositeOperation = clip.blendMode;
      }

      // Filter construction (combines basic ColorFilter and stacked ClipEffects)
      const filterParts: string[] = [];
      if (clip.filter) {
        const { brightness, contrast, saturation, blur } = clip.filter;
        if (brightness !== 1) filterParts.push(`brightness(${brightness})`);
        if (contrast !== 1) filterParts.push(`contrast(${contrast})`);
        if (saturation !== 1) filterParts.push(`saturate(${saturation})`);
        if (blur > 0) filterParts.push(`blur(${blur}px)`);
      }
      if (clip.effects && clip.effects.length > 0) {
        for (const eff of clip.effects) {
          if (!eff.enabled) continue;
          if (eff.type === 'blur' && (eff.intensity ?? 0) > 0) {
            filterParts.push(`blur(${eff.intensity}px)`);
          } else if (eff.type === 'brightness' && eff.value !== undefined) {
            filterParts.push(`brightness(${eff.value}%)`);
          } else if (eff.type === 'contrast' && eff.value !== undefined) {
            filterParts.push(`contrast(${eff.value}%)`);
          } else if (eff.type === 'saturation' && eff.value !== undefined) {
            filterParts.push(`saturate(${eff.value}%)`);
          } else if (eff.type === 'grayscale' && eff.value !== undefined) {
            filterParts.push(`grayscale(${eff.value}%)`);
          } else if (eff.type === 'sepia' && eff.value !== undefined) {
            filterParts.push(`sepia(${eff.value}%)`);
          } else if (eff.type === 'invert' && eff.value !== undefined) {
            filterParts.push(`invert(${eff.value}%)`);
          } else if (eff.type === 'hue-rotate' && eff.value !== undefined) {
            filterParts.push(`hue-rotate(${eff.value}deg)`);
          }
        }
      }
      if (filterParts.length > 0) {
        ctx.filter = filterParts.join(' ');
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

      // Mask Path Construction
      let hasMaskStroke = false;
      let maskStrokeWidth = 0;
      let maskStrokeColor = '#ffffff';

      if (clip.mask && clip.mask.type && clip.mask.type !== 'none') {
        const m = clip.mask;
        const mx = m.x || 0;
        const my = m.y || 0;
        const mw = m.width || 360;
        const mh = m.height || 240;
        const maskScale = m.scale || 1;
        const rot = ((m.rotation || 0) * Math.PI) / 180;

        hasMaskStroke = !!(m.strokeWidth && m.strokeWidth > 0);
        maskStrokeWidth = m.strokeWidth || 0;
        maskStrokeColor = m.strokeColor || '#ffffff';

        ctx.save();
        if (rot !== 0) {
          ctx.translate(mx, my);
          ctx.rotate(rot);
          ctx.translate(-mx, -my);
        }

        ctx.beginPath();

        if (m.type === 'rectangle') {
          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
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
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
            ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
            ctx.clip('evenodd');
          } else {
            ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
            ctx.clip();
          }
        } else if (m.type === 'split') {
          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
            ctx.rect(-width * 3, my, width * 6, height * 3);
            ctx.clip('evenodd');
          } else {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 3 + my);
            ctx.clip();
          }
        } else if (m.type === 'cinematic-bars') {
          const barHeight = mh || 120;
          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
            ctx.rect(-width * 3, -height / 2 + barHeight, width * 6, height - barHeight * 2);
            ctx.clip('evenodd');
          } else {
            ctx.rect(-width * 3, -height / 2 + barHeight, width * 6, height - barHeight * 2);
            ctx.clip();
          }
        } else if (m.type === 'diamond') {
          const hw = (mw * maskScale) / 2;
          const hh = (mh * maskScale) / 2;
          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
          }
          ctx.moveTo(mx, my - hh);
          ctx.lineTo(mx + hw, my);
          ctx.lineTo(mx, my + hh);
          ctx.lineTo(mx - hw, my);
          ctx.closePath();
          if (m.inverted) {
            ctx.clip('evenodd');
          } else {
            ctx.clip();
          }
        } else if (m.type === 'star') {
          const spikes = 5;
          const outerRadius = (mw * maskScale) / 2;
          const innerRadius = outerRadius * 0.45;
          let srot = (Math.PI / 2) * 3;
          const sstep = Math.PI / spikes;

          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
          }
          ctx.moveTo(mx, my - outerRadius);
          for (let i = 0; i < spikes; i++) {
            let px = mx + Math.cos(srot) * outerRadius;
            let py = my + Math.sin(srot) * outerRadius;
            ctx.lineTo(px, py);
            srot += sstep;

            px = mx + Math.cos(srot) * innerRadius;
            py = my + Math.sin(srot) * innerRadius;
            ctx.lineTo(px, py);
            srot += sstep;
          }
          ctx.closePath();
          if (m.inverted) {
            ctx.clip('evenodd');
          } else {
            ctx.clip();
          }
        } else if (m.type === 'heart') {
          const s = (mw * maskScale) / 200;
          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
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
        } else if (m.type === 'text') {
          const textContent = m.content || 'MASK';
          const tFontSize = m.fontSize || 120;
          ctx.font = `bold ${tFontSize}px ${m.fontFamily || 'Inter, system-ui'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (m.inverted) {
            ctx.rect(-width * 3, -height * 3, width * 6, height * 6);
            ctx.clip('evenodd');
          }
        }

        ctx.restore();
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
        const fontWeight = clip.fontWeight || 'bold';
        const fontStyle = clip.fontStyle === 'italic' ? 'italic' : 'normal';
        const fontFamily = clip.fontFamily || 'Inter, system-ui';
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = clip.textAlign || 'center';
        ctx.textBaseline = 'middle';

        // Letter spacing
        if (clip.letterSpacing && 'letterSpacing' in ctx) {
          (ctx as any).letterSpacing = `${clip.letterSpacing}px`;
        }

        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize * (clip.lineHeight || 1.2);

        // Text Background box
        const bgEnabled = clip.backgroundEnabled ?? (!!clip.backgroundColor && clip.backgroundColor !== 'transparent');
        if (bgEnabled) {
          const padX = clip.backgroundPaddingX ?? 20;
          const padY = clip.backgroundPaddingY ?? 12;
          const radius = clip.backgroundCornerRadius ?? 8;
          const offX = clip.backgroundOffsetX ?? 0;
          const offY = clip.backgroundOffsetY ?? 0;

          const bgW = textWidth + padX * 2;
          const bgH = textHeight + padY * 2;

          let startX = -bgW / 2 + offX;
          if (clip.textAlign === 'left') startX = -padX + offX;
          else if (clip.textAlign === 'right') startX = -textWidth - padX + offX;

          ctx.fillStyle = clip.backgroundColor || 'rgba(0,0,0,0.7)';
          ctx.beginPath();
          ctx.roundRect(startX, -bgH / 2 + offY, bgW, bgH, radius);
          ctx.fill();
        }

        // Text shadow for crisp legibility
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = clip.fontColor || '#ffffff';
        ctx.fillText(text, 0, 0);

        // Text decoration
        if (clip.textDecoration === 'underline') {
          ctx.lineWidth = Math.max(2, fontSize / 16);
          ctx.strokeStyle = clip.fontColor || '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-textWidth / 2, fontSize * 0.55);
          ctx.lineTo(textWidth / 2, fontSize * 0.55);
          ctx.stroke();
        } else if (clip.textDecoration === 'line-through') {
          ctx.lineWidth = Math.max(2, fontSize / 16);
          ctx.strokeStyle = clip.fontColor || '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-textWidth / 2, 0);
          ctx.lineTo(textWidth / 2, 0);
          ctx.stroke();
        }
      }

      // Draw mask stroke outline if configured
      if (hasMaskStroke) {
        ctx.strokeStyle = maskStrokeColor;
        ctx.lineWidth = maskStrokeWidth;
        ctx.stroke();
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
