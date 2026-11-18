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

  // Decorative visuals
  if (isCountdown) {
    // Rotating radar circle with countdown 5
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(80, 45, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 45);
    ctx.lineTo(80 + Math.cos(0.8) * 26, 45 + Math.sin(0.8) * 26);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 80, 45);
  } else if (isPip) {
    // Picture in Picture preview frame
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 20, 90, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIP OVERLAY', 80, 45);
  } else {
    // General film graphic
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, 15, 110, 60);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 14), 80, 45);
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
