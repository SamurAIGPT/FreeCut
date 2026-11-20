import { AspectRatio, Clip, MediaAsset, Track, ClipMask } from '@/types/editor';
import { useEditorStore } from '@/store/useEditorStore';

function addRoundRect(path: Path2D | CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  if (typeof (path as any).roundRect === 'function') {
    (path as any).roundRect(x, y, w, h, radius);
  } else if (radius <= 0) {
    path.rect(x, y, w, h);
  } else {
    path.moveTo(x + radius, y);
    path.arcTo(x + w, y, x + w, y + h, radius);
    path.arcTo(x + w, y + h, x, y + h, radius);
    path.arcTo(x, y + h, x, y, radius);
    path.arcTo(x, y, x + w, y, radius);
    path.closePath();
  }
}

function buildMaskLocalPath(m: ClipMask): Path2D {
  const path = new Path2D();
  const mx = m.x || 0;
  const my = m.y || 0;
  const maskScale = m.scale || 1;
  const mw = (m.width || 360) * maskScale;
  const mh = (m.height || 240) * maskScale;

  switch (m.type) {
    case 'rectangle': {
      addRoundRect(path, mx - mw / 2, my - mh / 2, mw, mh, m.radius || 0);
      break;
    }
    case 'circle': {
      const r = mw / 2;
      path.arc(mx, my, Math.max(1, r), 0, Math.PI * 2);
      break;
    }
    case 'ellipse': {
      const rx = Math.max(1, mw / 2);
      const ry = Math.max(1, mh / 2);
      path.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
      break;
    }
    case 'split': {
      // In local coordinates before rotation, split line passes through (mx, my).
      // Standard half-plane split: keeps upper half-plane.
      const span = 10000;
      path.rect(mx - span / 2, my - span, span, span);
      break;
    }
    case 'cinematic-bars': {
      // Aperture band centered at (mx, my) with height mh and full horizontal span
      const span = 10000;
      path.rect(mx - span / 2, my - mh / 2, span, mh);
      break;
    }
    case 'diamond': {
      const hw = mw / 2;
      const hh = mh / 2;
      path.moveTo(mx, my - hh);
      path.lineTo(mx + hw, my);
      path.lineTo(mx, my + hh);
      path.lineTo(mx - hw, my);
      path.closePath();
      break;
    }
    case 'star': {
      const spikes = 5;
      const outerRadius = mw / 2;
      const innerRadius = outerRadius * 0.45;
      let srot = (Math.PI / 2) * 3;
      const sstep = Math.PI / spikes;

      path.moveTo(mx + Math.cos(srot) * outerRadius, my + Math.sin(srot) * outerRadius);
      for (let i = 0; i < spikes; i++) {
        path.lineTo(mx + Math.cos(srot) * outerRadius, my + Math.sin(srot) * outerRadius);
        srot += sstep;
        path.lineTo(mx + Math.cos(srot) * innerRadius, my + Math.sin(srot) * innerRadius);
        srot += sstep;
      }
      path.closePath();
      break;
    }
    case 'heart': {
      const halfWidth = mw / 2;
      const halfHeight = mh / 2;
      const startX = mx;
      const startY = my - halfHeight * 0.475;
      path.moveTo(startX, startY);
      path.bezierCurveTo(
        mx + halfWidth, my - halfHeight * 1.225,
        mx + halfWidth, my - halfHeight * 0.125,
        mx, my + halfHeight * 0.725
      );
      path.bezierCurveTo(
        mx - halfWidth, my - halfHeight * 0.125,
        mx - halfWidth, my - halfHeight * 1.225,
        startX, startY
      );
      path.closePath();
      break;
    }
  }

  return path;
}

function getTransformedMaskPath(m: ClipMask): Path2D {
  const localPath = buildMaskLocalPath(m);
  const rotDeg = m.rotation || 0;
  const mx = m.x || 0;
  const my = m.y || 0;

  if (rotDeg === 0) {
    return localPath;
  }

  const matrix = new DOMMatrix();
  matrix.translateSelf(mx, my);
  matrix.rotateSelf(rotDeg);
  matrix.translateSelf(-mx, -my);

  const transformedPath = new Path2D();
  transformedPath.addPath(localPath, matrix);
  return transformedPath;
}

function getMaskClipPath(m: ClipMask, transformedPath: Path2D): Path2D {
  if (m.inverted) {
    const clipPath = new Path2D();
    const big = 20000;
    clipPath.rect(-big / 2, -big / 2, big, big);
    clipPath.addPath(transformedPath);
    return clipPath;
  }
  return transformedPath;
}

class CanvasCompositor {
  private videoCache = new Map<string, HTMLVideoElement>();
  private imageCache = new Map<string, HTMLImageElement>();
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;

  private getBuffers(w: number, h: number) {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
    }
    if (!this.maskCanvas) {
      this.maskCanvas = document.createElement('canvas');
    }
    if (this.offscreenCanvas.width !== w || this.offscreenCanvas.height !== h) {
      this.offscreenCanvas.width = w;
      this.offscreenCanvas.height = h;
    }
    if (this.maskCanvas.width !== w || this.maskCanvas.height !== h) {
      this.maskCanvas.width = w;
      this.maskCanvas.height = h;
    }
    return {
      offscreen: this.offscreenCanvas,
      offCtx: this.offscreenCanvas.getContext('2d')!,
      mask: this.maskCanvas,
      maskCtx: this.maskCanvas.getContext('2d')!,
    };
  }

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
      if (clip.isHidden) return false;
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
      // 5a. Global Effect / Adjustment Layer Clip
      if (clip.type === 'effect') {
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
          const { offscreen, offCtx } = this.getBuffers(width, height);
          offCtx.clearRect(0, 0, width, height);
          offCtx.drawImage(canvas, 0, 0);

          ctx.save();
          ctx.filter = filterParts.join(' ');
          ctx.globalAlpha = clip.transform.opacity ?? 1;
          if (clip.blendMode) ctx.globalCompositeOperation = clip.blendMode;
          ctx.drawImage(offscreen, 0, 0);
          ctx.restore();
        }
        continue;
      }

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

      // Transitions (In and Out)
      let transitionAlpha = 1;
      const timeInClip = playhead - clip.start;
      const timeRemaining = clip.start + clip.duration - playhead;

      if (clip.transitionIn) {
        const inDur = Math.max(0.1, clip.transitionIn.duration || 0.5);
        if (timeInClip >= 0 && timeInClip < inDur) {
          const p = Math.max(0, Math.min(1, timeInClip / inDur));
          switch (clip.transitionIn.type) {
            case 'fade':
            case 'dissolve':
              transitionAlpha *= p;
              break;
            case 'zoom': {
              const z = 0.6 + p * 0.4;
              ctx.scale(z, z);
              transitionAlpha *= p;
              break;
            }
            case 'slide-left': {
              ctx.translate((1 - p) * (width * 0.4), 0);
              break;
            }
            case 'slide-right': {
              ctx.translate((1 - p) * (-width * 0.4), 0);
              break;
            }
            case 'glitch': {
              if (Math.random() < (1 - p) * 0.6) {
                ctx.translate((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12);
              }
              break;
            }
          }
        }
      }

      if (clip.transitionOut) {
        const outDur = Math.max(0.1, clip.transitionOut.duration || 0.5);
        if (timeRemaining >= 0 && timeRemaining < outDur) {
          const p = Math.max(0, Math.min(1, timeRemaining / outDur));
          switch (clip.transitionOut.type) {
            case 'fade':
            case 'dissolve':
              transitionAlpha *= p;
              break;
            case 'zoom': {
              const z = 1.0 + (1 - p) * 0.4;
              ctx.scale(z, z);
              transitionAlpha *= p;
              break;
            }
            case 'slide-left': {
              ctx.translate((1 - p) * (-width * 0.4), 0);
              break;
            }
            case 'slide-right': {
              ctx.translate((1 - p) * (width * 0.4), 0);
              break;
            }
          }
        }
      }

      // Transform (offset from center)
      const centerX = width / 2 + clip.transform.x;
      const centerY = height / 2 + clip.transform.y;

      ctx.translate(centerX, centerY);
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);

      const scaleX = clip.transform.scaleX !== undefined ? clip.transform.scaleX : clip.transform.scale;
      const scaleY = clip.transform.scaleY !== undefined ? clip.transform.scaleY : clip.transform.scale;
      ctx.scale(scaleX, scaleY);
      ctx.globalAlpha = clip.transform.opacity * transitionAlpha;

      // Helper to draw the actual clip media or text onto any context
      const drawClipContent = (targetCtx: CanvasRenderingContext2D) => {
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

          targetCtx.drawImage(video, -dw / 2, -dh / 2, dw, dh);
        } else if (clip.type === 'image' && asset) {
          const img = this.getOrCreateImage(asset);
          const iWidth = asset.width || (img.naturalWidth > 0 ? img.naturalWidth : 800);
          const iHeight = asset.height || (img.naturalHeight > 0 ? img.naturalHeight : 600);
          const scale = Math.min(width / iWidth, height / iHeight);
          const dw = iWidth * scale;
          const dh = iHeight * scale;

          if (img.complete && img.naturalWidth > 0) {
            targetCtx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          } else {
            // If image is still decoding, trigger decode and draw fallback rect
            img.decode?.().catch(() => {});
          }
        } else if (clip.type === 'text') {
          const text = clip.text || 'FreeCut';
          const fontSize = clip.fontSize || 54;
          const fontWeight = clip.fontWeight || 'bold';
          const fontStyle = clip.fontStyle === 'italic' ? 'italic' : 'normal';
          const fontFamily = clip.fontFamily || 'Inter, system-ui';
          
          targetCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          targetCtx.textAlign = clip.textAlign || 'center';
          targetCtx.textBaseline = 'middle';

          // Letter spacing
          if (clip.letterSpacing && 'letterSpacing' in targetCtx) {
            (targetCtx as any).letterSpacing = `${clip.letterSpacing}px`;
          }

          const metrics = targetCtx.measureText(text);
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

            targetCtx.fillStyle = clip.backgroundColor || 'rgba(0,0,0,0.7)';
            targetCtx.beginPath();
            addRoundRect(targetCtx, startX, -bgH / 2 + offY, bgW, bgH, radius);
            targetCtx.fill();
          }

          // Text shadow for crisp legibility
          targetCtx.shadowColor = 'rgba(0,0,0,0.8)';
          targetCtx.shadowBlur = 8;
          targetCtx.fillStyle = clip.fontColor || '#ffffff';
          targetCtx.fillText(text, 0, 0);

          // Text decoration
          if (clip.textDecoration === 'underline') {
            targetCtx.lineWidth = Math.max(2, fontSize / 16);
            targetCtx.strokeStyle = clip.fontColor || '#ffffff';
            targetCtx.beginPath();
            targetCtx.moveTo(-textWidth / 2, fontSize * 0.55);
            targetCtx.lineTo(textWidth / 2, fontSize * 0.55);
            targetCtx.stroke();
          } else if (clip.textDecoration === 'line-through') {
            targetCtx.lineWidth = Math.max(2, fontSize / 16);
            targetCtx.strokeStyle = clip.fontColor || '#ffffff';
            targetCtx.beginPath();
            targetCtx.moveTo(-textWidth / 2, 0);
            targetCtx.lineTo(textWidth / 2, 0);
            targetCtx.stroke();
          }
        }
      };

      // Mask Processing
      const m = clip.mask;
      const hasMask = !!(m && m.type && m.type !== 'none');

      if (!hasMask) {
        drawClipContent(ctx);
      } else {
        const isFeathered = (m.feather && m.feather > 0) || m.type === 'text';

        if (!isFeathered) {
          // -----------------------------------------------------------------
          // CRISP VECTOR MASK (Zero-allocation, native hardware clip)
          // -----------------------------------------------------------------
          const transformedPath = getTransformedMaskPath(m);
          const clipPath = getMaskClipPath(m, transformedPath);

          ctx.save();
          ctx.clip(clipPath, m.inverted ? 'evenodd' : 'nonzero');
          drawClipContent(ctx);
          ctx.restore();

          // Stroke Outline
          if (m.strokeWidth && m.strokeWidth > 0) {
            ctx.save();
            ctx.strokeStyle = m.strokeColor || '#ffffff';
            ctx.lineWidth = m.strokeWidth;
            ctx.stroke(transformedPath);
            ctx.restore();
          }
        } else {
          // -----------------------------------------------------------------
          // SOFT FEATHERED / TEXT MASK (Offscreen destination-in composite)
          // -----------------------------------------------------------------
          const bufW = Math.max(width, 1920);
          const bufH = Math.max(height, 1080);
          const { offscreen, offCtx, mask: maskBuf, maskCtx } = this.getBuffers(bufW, bufH);

          offCtx.clearRect(0, 0, bufW, bufH);
          maskCtx.clearRect(0, 0, bufW, bufH);

          // 1. Draw media onto offscreen buffer centered at (bufW/2, bufH/2)
          offCtx.save();
          offCtx.translate(bufW / 2, bufH / 2);
          if (filterParts.length > 0) {
            offCtx.filter = filterParts.join(' ');
          }
          drawClipContent(offCtx);
          offCtx.restore();

          // 2. Draw mask shape or text onto mask buffer centered at (bufW/2, bufH/2)
          const mx = m.x || 0;
          const my = m.y || 0;
          const rotDeg = m.rotation || 0;

          maskCtx.save();
          maskCtx.translate(bufW / 2, bufH / 2);

          if (m.inverted) {
            maskCtx.fillStyle = '#ffffff';
            maskCtx.fillRect(-bufW / 2, -bufH / 2, bufW, bufH);
            maskCtx.globalCompositeOperation = 'destination-out';
          } else {
            maskCtx.fillStyle = '#ffffff';
          }

          if (m.feather && m.feather > 0) {
            maskCtx.filter = `blur(${m.feather}px)`;
          }

          if (m.type === 'text') {
            const textContent = m.content || 'MASK';
            const tFontSize = m.fontSize || 120;
            maskCtx.save();
            maskCtx.translate(mx, my);
            if (rotDeg !== 0) {
              maskCtx.rotate((rotDeg * Math.PI) / 180);
            }
            maskCtx.font = `bold ${tFontSize}px ${m.fontFamily || 'Inter, system-ui'}`;
            maskCtx.textAlign = 'center';
            maskCtx.textBaseline = 'middle';
            maskCtx.fillText(textContent, 0, 0);
            maskCtx.restore();
          } else {
            const transformedPath = getTransformedMaskPath(m);
            maskCtx.fill(transformedPath);
          }
          maskCtx.restore();

          // 3. Composite mask onto offscreen buffer
          offCtx.globalCompositeOperation = 'destination-in';
          offCtx.drawImage(maskBuf, 0, 0);

          // 4. Draw composite onto main canvas
          ctx.drawImage(offscreen, -bufW / 2, -bufH / 2);

          // 5. Draw stroke outline if configured
          if (m.strokeWidth && m.strokeWidth > 0 && m.type !== 'text') {
            const transformedPath = getTransformedMaskPath(m);
            ctx.save();
            ctx.strokeStyle = m.strokeColor || '#ffffff';
            ctx.lineWidth = m.strokeWidth;
            ctx.stroke(transformedPath);
            ctx.restore();
          }
        }
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
