import { Clip, MediaAsset } from '@/types/editor';

// In-memory cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

/**
 * Creates an authentic synthetic thumbnail for clips when no media file is attached.
 */
export function createSyntheticThumbnail(name: string, type: string): string {
  if (typeof document === 'undefined') return '';
  const cacheKey = `${type}-${name}`;
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isCountdown = name.toLowerCase().includes('countdown');
  const isPip = name.toLowerCase().includes('picture') || name.toLowerCase().includes('pip');
  const isCyberpunk = name.toLowerCase().includes('cyberpunk') || name.toLowerCase().includes('trailer');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 160, 90);
  if (isCountdown) {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0284c7');
  } else if (isPip) {
    grad.addColorStop(0, '#18181b');
    grad.addColorStop(0.5, '#4a044e');
    grad.addColorStop(1, '#701a75');
  } else if (isCyberpunk) {
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(0.5, '#065f46');
    grad.addColorStop(1, '#0e7490');
  } else {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 160, 90);

  // Decorative visuals (centered in lower 65% of tile, leaving top 28px clear for header)
  if (isCountdown) {
    // Rotating radar circle with countdown 5
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(80, 52, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 52);
    ctx.lineTo(80 + Math.cos(0.8) * 22, 52 + Math.sin(0.8) * 22);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 80, 53);
  } else if (isPip) {
    // Picture in Picture preview frame
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(35, 30, 90, 45);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIP OVERLAY', 80, 53);
  } else {
    // General film graphic
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, 28, 110, 48);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 14), 80, 53);
  }

  // Film frame separator line on the right edge
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(159, 0);
  ctx.lineTo(159, 90);
  ctx.stroke();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  thumbnailCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Returns the best thumbnail URL for a timeline clip:
 * 1. clip.thumbnailUrl
 * 2. matching mediaAsset.thumbnailUrl
 * 3. matching mediaAsset.url (for images)
 * 4. synthetic filmstrip thumbnail for video/image clips
 */
export function getClipThumbnail(clip: Clip, assets: MediaAsset[]): string | undefined {
  if (clip.type !== 'video' && clip.type !== 'image') {
    return undefined;
  }

  if (clip.thumbnailUrl) {
    return clip.thumbnailUrl;
  }

  if (clip.assetId) {
    const asset = assets.find((a) => a.id === clip.assetId);
    if (asset?.thumbnailUrl) {
      return asset.thumbnailUrl;
    }
    if (asset?.type === 'image' && asset.url) {
      return asset.url;
    }
  }

  if (clip.url && clip.type === 'image') {
    return clip.url;
  }

  // Fallback synthetic thumbnail so video clips ALWAYS have a filmstrip
  return createSyntheticThumbnail(clip.name, clip.type);
}

/**
 * Utility for generating high-fidelity project poster thumbnails for projects.
 */
export function generateProjectPoster(title: string, subtitle = 'FREECUT PRO'): string {
  try {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Deep rich cinematic gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 360);
    bgGrad.addColorStop(0, '#0a0d1a');
    bgGrad.addColorStop(0.5, '#12142e');
    bgGrad.addColorStop(1, '#080914');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 360);

    // Subtle perspective grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 360);
      ctx.stroke();
    }
    for (let y = 0; y < 360; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Glowing cyan/violet central radial halo
    const cx = 320;
    const cy = 160;
    const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
    radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    radGrad.addColorStop(0.5, 'rgba(129, 140, 248, 0.2)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    // Outer neon ring with tick marks
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.stroke();

    // Inner violet ring
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.stroke();

    // Central countdown number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', cx, cy);

    // Prominent title bar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillText(title.toUpperCase(), cx, 275);

    // Subtitle badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(subtitle, cx, 302);

    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return '';
  }
}

export function captureLiveCanvasThumbnail(canvas: HTMLCanvasElement): string | null {
  try {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

    const thumbCanvas = document.createElement('canvas');
    const width = 480;
    const height = Math.round((width * canvas.height) / canvas.width);
    thumbCanvas.width = width;
    thumbCanvas.height = height;

    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(canvas, 0, 0, width, height);
    return thumbCanvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  }
}
