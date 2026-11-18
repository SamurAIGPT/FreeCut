export type TrackType = 'video' | 'audio' | 'text';
export type ClipType = 'video' | 'audio' | 'image' | 'text';

export type SidebarTab = 
  | 'media' 
  | 'audio' 
  | 'text' 
  | 'stickers' 
  | 'effects' 
  | 'transitions' 
  | 'captions' 
  | 'adjustment' 
  | 'settings';

export interface Transform {
  x: number;          // Offset in px from center
  y: number;          // Offset in px from center
  scale: number;      // 1.0 = 100%
  scaleX?: number;    // 1.0 = 100%
  scaleY?: number;    // 1.0 = 100%
  rotation: number;   // Degrees (-180 to 180)
  opacity: number;    // 0.0 - 1.0
}

export type MaskType = 
  | 'none' 
  | 'split' 
  | 'cinematic-bars' 
  | 'rectangle' 
  | 'circle' 
  | 'ellipse' 
  | 'heart' 
  | 'diamond' 
  | 'star' 
  | 'text';

export interface ClipMask {
  type: MaskType;
  x: number;             // Center X offset (-500 to 500)
  y: number;             // Center Y offset (-500 to 500)
  width: number;         // Width in px (default 360)
  height: number;        // Height in px (default 240)
  scale?: number;        // Scale factor for shapes (default 1)
  radius?: number;       // Corner radius for rectangle (0 to 100)
  feather: number;       // Feather blur in px (0 to 100)
  inverted?: boolean;    // Invert mask
  rotation?: number;     // Rotation in degrees (-360 to 360)
  strokeWidth?: number;  // Stroke width in px (0 to 50)
  strokeColor?: string;  // Stroke color
  // Text mask specific
  content?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface ColorFilter {
  brightness: number; // 0.0 - 2.0 (default 1.0)
  contrast: number;   // 0.0 - 2.0 (default 1.0)
  saturation: number; // 0.0 - 2.0 (default 1.0)
  blur: number;       // 0 - 50px (default 0)
}

export interface ClipEffect {
  id: string;
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'grayscale' | 'sepia' | 'invert' | 'hue-rotate';
  name: string;
  enabled: boolean;
  intensity?: number;
  value?: number;
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
  volume: number;      // 0.0 - 1.0 (or dB)
  speed?: number;      // 0.01 - 100.0 (default 1.0)
  maintainPitch?: boolean;
  pan?: number;        // Stereo pan -1.0 to +1.0 (default 0)
  color?: string;      // Color for timeline item
  blendMode?: GlobalCompositeOperation;
  filter?: ColorFilter;
  effects?: ClipEffect[];
  mask?: ClipMask;
  keyframedProps?: string[];
  isMuted?: boolean;
  isHidden?: boolean;

  // Text clip specific properties
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;
  lineHeight?: number;

  // Text background properties
  backgroundColor?: string;
  backgroundEnabled?: boolean;
  backgroundCornerRadius?: number;
  backgroundPaddingX?: number;
  backgroundPaddingY?: number;
  backgroundOffsetX?: number;
  backgroundOffsetY?: number;

  // Audio specific
  fadeIn?: number;
  fadeOut?: number;
  thumbnailUrl?: string;
  url?: string;
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
