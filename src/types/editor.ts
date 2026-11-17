export type TrackType = 'video' | 'audio' | 'text';
export type ClipType = 'video' | 'audio' | 'image' | 'text';

export interface Transform {
  x: number;          // Offset in px from center
  y: number;          // Offset in px from center
  scale: number;      // 1.0 = 100%
  rotation: number;   // Degrees
  opacity: number;    // 0.0 - 1.0
}

export interface Clip {
  id: string;
  trackId: string;
  assetId?: string;
  name: string;
  type: ClipType;
  start: number;       // Start time on timeline in seconds
  duration: number;    // Visible duration on timeline in seconds
  trimStart: number;   // Source in-point in seconds
  trimEnd: number;     // Source out-point in seconds
  transform: Transform;
  volume: number;      // 0.0 - 1.0
  color?: string;      // Color for timeline item
  // Text clip specific properties
  text?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  isMuted?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  duration: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface AspectConfig {
  id: AspectRatio;
  name: string;
  width: number;
  height: number;
}
