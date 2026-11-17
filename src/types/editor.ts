export type TrackType = 'video' | 'audio' | 'text';
export type ClipType = 'video' | 'audio' | 'image' | 'text';

export type SidebarTab = 'media' | 'audio' | 'text' | 'effects' | 'transitions' | 'stickers' | 'filters';

export interface Transform {
  x: number;          // Offset in px from center
  y: number;          // Offset in px from center
  scale: number;      // 1.0 = 100%
  rotation: number;   // Degrees (-180 to 180)
  opacity: number;    // 0.0 - 1.0
}

export interface ColorFilter {
  brightness: number; // 0.0 - 2.0 (default 1.0)
  contrast: number;   // 0.0 - 2.0 (default 1.0)
  saturation: number; // 0.0 - 2.0 (default 1.0)
  blur: number;       // 0 - 20px (default 0)
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
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
  speed?: number;      // 0.25 - 4.0 (default 1.0)
  color?: string;      // Color for timeline item
  blendMode?: GlobalCompositeOperation;
  filter?: ColorFilter;
  isMuted?: boolean;
  isHidden?: boolean;
  // Text clip specific properties
  text?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  // Audio specific
  fadeIn?: number;
  fadeOut?: number;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  isMuted?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
  isSolo?: boolean;
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

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export interface AspectConfig {
  id: AspectRatio;
  name: string;
  width: number;
  height: number;
}
