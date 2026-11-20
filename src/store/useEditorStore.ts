import { create } from 'zustand';
import { AspectRatio, Clip, ClipEffect, ClipMask, ColorFilter, MediaAsset, SidebarTab, TimelineMarker, Track, TrackType, Transform } from '@/types/editor';
import { ProjectRecord, projectService } from '@/services/storage/projectService';
import { mediaStorage } from '@/services/storage/mediaStorage';

interface HistorySnapshot {
  tracks: Track[];
  clips: Clip[];
}

export type ThemeMode = 'dark' | 'light';

export type GuideType = 'none' | 'grid' | 'tiktok' | 'reels' | 'shorts';

export interface GridConfig {
  rows: number;
  cols: number;
}

interface EditorState {
  theme: ThemeMode;
  projectTitle: string;
  aspectRatio: AspectRatio;
  tracks: Track[];
  clips: Clip[];
  assets: MediaAsset[];
  playhead: number;
  duration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  zoom: number; // Pixels per second
  isSnapping: boolean;
  activeSidebarTab: SidebarTab;
  activeTool: 'select' | 'razor';
  canvasZoom: number;
  showGrid: boolean;
  activeGuide: GuideType;
  gridConfig: GridConfig;
  playbackRate: number;
  isMasterMuted: boolean;
  markers: TimelineMarker[];
  snapGuideX: number | null;
  isRippleMode: boolean;
  canvasBg: string;
  fps: number;
  currentProjectId: string | null;
  isSaving: boolean;
  copiedClip: Clip | null;

  // History
  history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setProjectTitle: (title: string) => void;
  setAspectRatio: (aspect: AspectRatio) => void;
  setPlayhead: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setSelectedClipId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  toggleSnapping: () => void;
  toggleRippleMode: () => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setActiveTool: (tool: 'select' | 'razor') => void;
  setCanvasZoom: (zoom: number) => void;
  toggleShowGrid: () => void;
  setActiveGuide: (guide: GuideType) => void;
  setGridConfig: (config: Partial<GridConfig>) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMasterMuted: () => void;
  setSnapGuideX: (x: number | null) => void;
  setCanvasBg: (bg: string) => void;
  setFps: (fps: number) => void;
  setCurrentProjectId: (id: string | null) => void;
  loadProjectRecord: (record: ProjectRecord) => void;
  saveCurrentProject: () => Promise<void>;
  
  // Markers
  addMarker: (time?: number, label?: string, color?: string) => void;
  moveMarker: (id: string, newTime: number) => void;
  updateMarker: (id: string, updates: Partial<TimelineMarker>) => void;
  deleteMarker: (id: string) => void;

  // Asset Management
  addAsset: (asset: MediaAsset) => void;
  deleteAsset: (assetId: string) => void;

  // Track Management
  addTrack: (type: TrackType, name?: string) => string;
  deleteTrack: (trackId: string) => void;
  moveTrack: (trackId: string, direction: 'up' | 'down') => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;

  // Clip Operations
  addClip: (clipData: Omit<Clip, 'id'>) => string;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  updateClipTransform: (id: string, updates: Partial<Transform>) => void;
  updateClipFilter: (id: string, updates: Partial<ColorFilter>) => void;
  updateClipMask: (id: string, updates: Partial<ClipMask> | null) => void;
  addClipEffect: (clipId: string, effect: Omit<ClipEffect, 'id'>) => void;
  updateClipEffect: (clipId: string, effectId: string, updates: Partial<ClipEffect>) => void;
  removeClipEffect: (clipId: string, effectId: string) => void;
  toggleClipEffect: (clipId: string, effectId: string) => void;
  reorderClipEffects: (clipId: string, fromIndex: number, toIndex: number) => void;
  toggleClipKeyframe: (id: string, property: string) => void;
  splitClip: (clipId: string, splitTime?: number) => void;
  splitLeft: (clipId: string) => void;
  splitRight: (clipId: string) => void;
  duplicateClip: (clipId: string) => void;
  copyClip: (clipId: string) => void;
  pasteClip: (targetTrackId?: string, targetTime?: number) => void;
  toggleClipHidden: (clipId: string) => void;
  extractAudio: (clipId: string) => void;
  rippleDelete: (clipId: string) => void;
  moveClipToTrack: (clipId: string, targetTrackId: string, newStart?: number) => void;
  deleteClip: (clipId: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

const DEFAULT_TRACKS: Track[] = [
  { id: 'track-text-1', name: 'Text & Titles', type: 'text', isVisible: true },
  { id: 'track-video-2', name: 'Overlay B-Roll', type: 'video', isVisible: true },
  { id: 'track-video-1', name: 'Main Track', type: 'video', isVisible: true },
  { id: 'track-audio-1', name: 'Soundtrack', type: 'audio', isVisible: true, isMuted: false },
  { id: 'track-audio-2', name: 'Sound FX', type: 'audio', isVisible: true, isMuted: false },
];

const DEFAULT_CLIPS: Clip[] = [
  {
    id: 'clip-text-1',
    trackId: 'track-text-1',
    name: 'Cyberpunk Master Cut',
    type: 'text',
    text: 'CYBERPUNK MASTER CUT',
    fontSize: 48,
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    fontFamily: 'Inter, system-ui',
    start: 0.8,
    duration: 4.5,
    trimStart: 0,
    trimEnd: 4.5,
    transform: { x: 0, y: -80, scale: 1, rotation: 0, opacity: 1 },
    volume: 0,
  },
  {
    id: 'clip-video-2',
    trackId: 'track-video-2',
    name: 'Picture-in-Picture.webm',
    type: 'video',
    start: 2.2,
    duration: 3.5,
    trimStart: 0,
    trimEnd: 3.5,
    transform: { x: 180, y: -100, scale: 0.45, rotation: 0, opacity: 1 },
    volume: 0.7,
  },
  {
    id: 'clip-video-1',
    trackId: 'track-video-1',
    name: 'Cinematic Countdown.webm',
    type: 'video',
    start: 0,
    duration: 6.8,
    trimStart: 0,
    trimEnd: 6.8,
    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    volume: 1,
  },
  {
    id: 'clip-audio-1',
    trackId: 'track-audio-1',
    name: 'Lo-Fi Ambient Beat.wav',
    type: 'audio',
    start: 0,
    duration: 8.5,
    trimStart: 0,
    trimEnd: 8.5,
    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    volume: 0.85,
  },
];

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const qTheme = params.get('theme');
    if (qTheme === 'light' || qTheme === 'dark') return qTheme;
    const saved = localStorage.getItem('freecut_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark'; // Pure dark default
};

export const useEditorStore = create<EditorState>((set, get) => ({
  theme: getInitialTheme(),
  projectTitle: 'Cyberpunk Trailer Project',
  aspectRatio: '16:9',
  tracks: DEFAULT_TRACKS,
  clips: DEFAULT_CLIPS,
  assets: [],
  playhead: 0,
  duration: 15,
  isPlaying: false,
  selectedClipId: null,
  zoom: 80,
  isSnapping: true,
  activeSidebarTab: 'media',
  activeTool: 'select',
  canvasZoom: 0,
  showGrid: false,
  activeGuide: 'none',
  gridConfig: { rows: 3, cols: 3 },
  playbackRate: 1,
  isMasterMuted: false,
  markers: [
    { id: 'marker-1', time: 2.0, label: 'Intro Cut', color: '#3b82f6' },
    { id: 'marker-2', time: 5.0, label: 'B-Roll In', color: '#10b981' },
  ],
  snapGuideX: null,
  isRippleMode: false,
  canvasBg: '#000000',
  fps: 30,
  currentProjectId: null,
  isSaving: false,
  copiedClip: null,
  history: { past: [], future: [] },

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('freecut_theme', theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setProjectTitle: (title) => set({ projectTitle: title }),
  setAspectRatio: (aspect) => set({ aspectRatio: aspect }),
  
  setPlayhead: (time) => {
    const duration = get().duration;
    const clamped = Math.max(0, Math.min(time, duration));
    if (Math.abs(get().playhead - clamped) < 0.0001) return;
    set({ playhead: clamped });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(zoom, 300)) }),
  toggleSnapping: () => set((state) => ({ isSnapping: !state.isSnapping })),
  toggleRippleMode: () => set((state) => ({ isRippleMode: !state.isRippleMode })),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
  toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setActiveGuide: (guide) => set({ activeGuide: guide, showGrid: guide === 'grid' }),
  setGridConfig: (config) => set((s) => ({ gridConfig: { ...s.gridConfig, ...config } })),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  toggleMasterMuted: () => set((s) => ({ isMasterMuted: !s.isMasterMuted })),
  setSnapGuideX: (x) => set({ snapGuideX: x }),
  setCanvasBg: (bg) => set({ canvasBg: bg }),
  setFps: (fps) => set({ fps }),

  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  loadProjectRecord: (record) => {
    // Sync fingerprint so initial load doesn't trigger redundant auto-save
    lastSerializedState = `${record.name}|${record.aspectRatio}|${record.fps || 30}|${record.canvasBg || '#000000'}|${Math.max(record.duration || 10, 10)}|${(record.tracks || []).length}|${(record.clips || []).length}|${(record.assets || []).length}|${(record.clips || []).map((c) => `${c.id}:${c.start}:${c.duration}:${c.effects?.length || 0}`).join(',')}`;

    set({
      currentProjectId: record.id,
      projectTitle: record.name,
      aspectRatio: record.aspectRatio,
      fps: record.fps || 30,
      canvasBg: record.canvasBg || '#000000',
      duration: Math.max(record.duration || 10, 10),
      tracks: record.tracks || [],
      clips: record.clips || [],
      assets: record.assets || [],
      playhead: 0,
      selectedClipId: null,
      history: { past: [], future: [] },
    });

    // Rehydrate assets and clips asynchronously from mediaStorage in case blob: URLs expired across browser sessions
    if (record.assets && record.assets.length > 0) {
      setTimeout(async () => {
        let changed = false;
        const updatedAssets = await Promise.all(
          (record.assets || []).map(async (asset) => {
            const freshUrl = await mediaStorage.getMediaUrl(asset.id);
            if (freshUrl && freshUrl !== asset.url) {
              changed = true;
              return {
                ...asset,
                url: freshUrl,
                thumbnailUrl: asset.thumbnailUrl?.startsWith('blob:') ? freshUrl : (asset.thumbnailUrl || freshUrl),
              };
            }
            return asset;
          })
        );
        if (changed) {
          const state = get();
          const assetUrlMap = new Map(updatedAssets.map((a) => [a.id, a.url]));
          const updatedClips = state.clips.map((clip) => {
            if (clip.assetId && assetUrlMap.has(clip.assetId)) {
              return { ...clip, url: assetUrlMap.get(clip.assetId) };
            }
            return clip;
          });
          set({ assets: updatedAssets, clips: updatedClips });
        }
      }, 0);
    }
  },

  saveCurrentProject: async () => {
    const state = get();
    const pid = state.currentProjectId;
    if (!pid) return;

    set({ isSaving: true });
    try {
      let thumbnail: string | undefined = undefined;
      if (typeof document !== 'undefined') {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          try {
            const thumbCanvas = document.createElement('canvas');
            const thumbW = 320;
            const thumbH = Math.round((thumbW * canvas.height) / (canvas.width || 1));
            thumbCanvas.width = thumbW;
            thumbCanvas.height = thumbH;
            const ctx = thumbCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(canvas, 0, 0, thumbW, thumbH);
              thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);
            }
          } catch {
            // ignore canvas extraction error
          }
        }
      }

      await projectService.saveProject({
        id: pid,
        name: state.projectTitle,
        duration: state.duration,
        aspectRatio: state.aspectRatio,
        fps: state.fps,
        canvasBg: state.canvasBg,
        tracks: state.tracks,
        clips: state.clips,
        assets: state.assets,
        thumbnail,
      });
    } finally {
      setTimeout(() => set({ isSaving: false }), 300);
    }
  },

  addMarker: (time, label, color) => {
    const state = get();
    const markerTime = time !== undefined ? time : state.playhead;
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: Math.round(markerTime * 100) / 100,
      label: label || `Marker ${state.markers.length + 1}`,
      color: color || '#3b82f6',
    };
    set({ markers: [...state.markers, newMarker] });
  },

  moveMarker: (id, newTime) => {
    const clamped = Math.max(0, Math.round(newTime * 100) / 100);
    set((state) => ({
      markers: state.markers.map((m) => (m.id === id ? { ...m, time: clamped } : m)),
    }));
  },

  updateMarker: (id, updates) => {
    set((state) => ({
      markers: state.markers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteMarker: (id) =>
    set((state) => ({ markers: state.markers.filter((m) => m.id !== id) })),

  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  deleteAsset: (id) => set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

  addTrack: (type, name) => {
    const id = `track-${type}-${Date.now()}`;
    const newTrack: Track = {
      id,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${get().tracks.filter((t) => t.type === type).length + 1}`,
      type,
      isVisible: true,
    };
    set((state) => ({ tracks: [...state.tracks, newTrack] }));
    return id;
  },

  deleteTrack: (trackId) => {
    const state = get();
    if (state.tracks.length <= 1) return;
    set({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      clips: state.clips.filter((c) => c.trackId !== trackId),
      selectedClipId: null,
    });
  },

  moveTrack: (trackId, direction) => {
    const state = get();
    const index = state.tracks.findIndex((t) => t.id === trackId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= state.tracks.length) return;
    const newTracks = [...state.tracks];
    const [moved] = newTracks.splice(index, 1);
    newTracks.splice(targetIndex, 0, moved);
    set({ tracks: newTracks });
  },

  toggleTrackMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t)),
    })),

  toggleTrackLock: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, isLocked: !t.isLocked } : t)),
    })),

  toggleTrackVisibility: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, isVisible: !t.isVisible } : t)),
    })),

  toggleTrackSolo: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, isSolo: !t.isSolo } : t)),
    })),

  addClip: (clipData) => {
    const state = get();
    const newId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newClip: Clip = {
      ...clipData,
      id: newId,
      filter: clipData.filter || { brightness: 1, contrast: 1, saturation: 1, blur: 0 },
      speed: clipData.speed || 1,
    };

    const clipEnd = newClip.start + newClip.duration;
    const newDuration = Math.max(state.duration, clipEnd);

    set({
      history: {
        past: [...state.history.past, { tracks: state.tracks, clips: state.clips }],
        future: [],
      },
      clips: [...state.clips, newClip],
      duration: newDuration,
      selectedClipId: newId,
    });

    return newId;
  },

  updateClip: (id, updates) => {
    const state = get();
    const updatedClips = state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c));
    const maxEnd = updatedClips.length > 0 ? Math.max(...updatedClips.map((c) => c.start + c.duration)) : 0;

    set({
      clips: updatedClips,
      duration: Math.max(maxEnd, 10),
    });
  },

  updateClipTransform: (id, updates) => {
    const state = get();
    set({
      clips: state.clips.map((c) =>
        c.id === id
          ? {
              ...c,
              transform: { ...c.transform, ...updates },
            }
          : c
      ),
    });
  },

  updateClipFilter: (id, updates) => {
    const state = get();
    set({
      clips: state.clips.map((c) =>
        c.id === id
          ? {
              ...c,
              filter: { ...(c.filter || { brightness: 1, contrast: 1, saturation: 1, blur: 0 }), ...updates },
            }
          : c
      ),
    });
  },

  updateClipMask: (id, updates) => {
    const state = get();
    set({
      clips: state.clips.map((c) => {
        if (c.id !== id) return c;
        if (updates === null) {
          const { mask, ...rest } = c;
          return rest as Clip;
        }
        return {
          ...c,
          mask: {
            ...(c.mask || {
              type: 'rectangle',
              x: 0,
              y: 0,
              width: 360,
              height: 240,
              radius: 0,
              feather: 0,
              inverted: false,
            }),
            ...updates,
          },
        };
      }),
    });
  },

  addClipEffect: (clipId, effectData) => {
    const state = get();
    const newEffect: ClipEffect = {
      ...effectData,
      id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    set({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, effects: [...(c.effects || []), newEffect] }
          : c
      ),
    });
  },

  updateClipEffect: (clipId, effectId, updates) => {
    const state = get();
    set({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              effects: (c.effects || []).map((eff) =>
                eff.id === effectId ? { ...eff, ...updates } : eff
              ),
            }
          : c
      ),
    });
  },

  removeClipEffect: (clipId, effectId) => {
    const state = get();
    set({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, effects: (c.effects || []).filter((eff) => eff.id !== effectId) }
          : c
      ),
    });
  },

  toggleClipEffect: (clipId, effectId) => {
    const state = get();
    set({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              effects: (c.effects || []).map((eff) =>
                eff.id === effectId ? { ...eff, enabled: !eff.enabled } : eff
              ),
            }
          : c
      ),
    });
  },

  reorderClipEffects: (clipId, fromIndex, toIndex) => {
    const state = get();
    set({
      clips: state.clips.map((c) => {
        if (c.id !== clipId) return c;
        const current = [...(c.effects || [])];
        if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) return c;
        const [moved] = current.splice(fromIndex, 1);
        current.splice(toIndex, 0, moved);
        return { ...c, effects: current };
      }),
    });
  },

  toggleClipKeyframe: (id, property) => {
    const state = get();
    set({
      clips: state.clips.map((c) => {
        if (c.id !== id) return c;
        const current = c.keyframedProps || [];
        const exists = current.includes(property);
        const updated = exists ? current.filter((p) => p !== property) : [...current, property];
        return { ...c, keyframedProps: updated };
      }),
    });
  },

  splitClip: (clipId, customSplitTime) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const splitAt = customSplitTime ?? state.playhead;
    if (splitAt <= clip.start || splitAt >= clip.start + clip.duration) return;

    const firstDuration = splitAt - clip.start;
    const secondDuration = clip.duration - firstDuration;

    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];

    const firstClip: Clip = {
      ...clip,
      duration: firstDuration,
      trimEnd: clip.trimStart + firstDuration,
    };

    const secondClip: Clip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${clip.name} (Cut)`,
      start: splitAt,
      duration: secondDuration,
      trimStart: clip.trimStart + firstDuration,
    };

    set({
      history: { past, future: [] },
      clips: state.clips.map((c) => (c.id === clipId ? firstClip : c)).concat(secondClip),
      selectedClipId: secondClip.id,
    });
  },

  splitLeft: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const cutAt = state.playhead;
    if (cutAt <= clip.start || cutAt >= clip.start + clip.duration) return;
    const trimDelta = cutAt - clip.start;
    const newDuration = clip.duration - trimDelta;
    if (newDuration < 0.1) return;

    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    const updated: Clip = {
      ...clip,
      start: cutAt,
      duration: newDuration,
      trimStart: clip.trimStart + trimDelta,
    };
    set({
      history: { past, future: [] },
      clips: state.clips.map((c) => (c.id === clipId ? updated : c)),
    });
  },

  splitRight: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const cutAt = state.playhead;
    if (cutAt <= clip.start || cutAt >= clip.start + clip.duration) return;
    const newDuration = cutAt - clip.start;
    if (newDuration < 0.1) return;

    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    const updated: Clip = {
      ...clip,
      duration: newDuration,
      trimEnd: clip.trimStart + newDuration,
    };
    set({
      history: { past, future: [] },
      clips: state.clips.map((c) => (c.id === clipId ? updated : c)),
    });
  },

  duplicateClip: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const newId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newClip: Clip = {
      ...clip,
      id: newId,
      name: `${clip.name} (Copy)`,
      start: clip.start + clip.duration + 0.1,
    };
    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    set({
      history: { past, future: [] },
      clips: [...state.clips, newClip],
      selectedClipId: newId,
      duration: Math.max(state.duration, newClip.start + newClip.duration),
    });
  },

  copyClip: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (clip) {
      set({ copiedClip: { ...clip } });
    }
  },

  pasteClip: (targetTrackId, targetTime) => {
    const state = get();
    if (!state.copiedClip) return;
    const clipToCopy = state.copiedClip;
    let track = targetTrackId ? state.tracks.find((t) => t.id === targetTrackId) : null;
    if (!track) {
      track = state.tracks.find((t) => t.id === clipToCopy.trackId) || state.tracks[0];
    }
    if (!track) return;

    const time = targetTime !== undefined ? Math.max(0, targetTime) : state.playhead;
    const newId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newClip: Clip = {
      ...clipToCopy,
      id: newId,
      trackId: track.id,
      start: time,
      name: `${clipToCopy.name} (Copy)`,
    };
    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    set({
      history: { past, future: [] },
      clips: [...state.clips, newClip],
      selectedClipId: newId,
      duration: Math.max(state.duration, newClip.start + newClip.duration),
    });
  },

  toggleClipHidden: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    set({
      history: { past, future: [] },
      clips: state.clips.map((c) => (c.id === clipId ? { ...c, isHidden: !c.isHidden } : c)),
    });
  },

  extractAudio: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip || clip.type !== 'video') return;

    // Find or create an audio track
    let audioTrack = state.tracks.find((t) => t.type === 'audio');
    let updatedTracks = state.tracks;
    if (!audioTrack) {
      audioTrack = {
        id: `track-audio-${Date.now()}`,
        name: 'Extracted Audio',
        type: 'audio',
        isVisible: true,
      };
      updatedTracks = [...state.tracks, audioTrack];
    }

    const audioClipId = `clip-audio-${Date.now()}`;
    const extractedAudioClip: Clip = {
      id: audioClipId,
      trackId: audioTrack.id,
      assetId: clip.assetId,
      name: `${clip.name} (Audio)`,
      type: 'audio',
      start: clip.start,
      duration: clip.duration,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      volume: clip.volume || 1,
      color: '#059669',
    };

    const updatedVideoClip: Clip = {
      ...clip,
      volume: 0,
      isMuted: true,
    };

    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    set({
      tracks: updatedTracks,
      clips: state.clips.map((c) => (c.id === clipId ? updatedVideoClip : c)).concat(extractedAudioClip),
      history: { past, future: [] },
      selectedClipId: audioClipId,
    });
  },

  rippleDelete: (clipId) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const gap = clip.duration;
    const clipTrackId = clip.trackId;
    const clipStart = clip.start;

    const remainingClips = state.clips.filter((c) => c.id !== clipId).map((c) => {
      if (c.trackId === clipTrackId && c.start > clipStart) {
        return {
          ...c,
          start: Math.max(0, c.start - gap),
        };
      }
      return c;
    });

    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    set({
      history: { past, future: [] },
      clips: remainingClips,
      selectedClipId: null,
    });
  },

  moveClipToTrack: (clipId, targetTrackId, newStart) => {
    const state = get();
    const targetTrack = state.tracks.find((t) => t.id === targetTrackId);
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip || !targetTrack) return;

    if (clip.type === 'audio' && targetTrack.type !== 'audio') return;
    if (clip.type !== 'audio' && targetTrack.type === 'audio') return;

    set({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              trackId: targetTrackId,
              start: newStart !== undefined ? Math.max(0, newStart) : c.start,
            }
          : c
      ),
    });
  },

  deleteClip: (clipId) => {
    const state = get();
    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];
    set({
      history: { past, future: [] },
      clips: state.clips.filter((c) => c.id !== clipId),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    });
  },

  undo: () => {
    const { history, tracks, clips } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    set({
      tracks: previous.tracks,
      clips: previous.clips,
      history: {
        past: newPast,
        future: [{ tracks, clips }, ...history.future],
      },
      selectedClipId: null,
    });
  },

  redo: () => {
    const { history, tracks, clips } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      tracks: next.tracks,
      clips: next.clips,
      history: {
        past: [...history.past, { tracks, clips }],
        future: newFuture,
      },
      selectedClipId: null,
    });
  },
}));

// Auto-save debouncer for active project
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSerializedState = '';

useEditorStore.subscribe((state) => {
  if (!state.currentProjectId) return;

  // Fingerprint of persistent project fields
  const fingerprint = `${state.projectTitle}|${state.aspectRatio}|${state.fps}|${state.canvasBg}|${state.duration}|${state.tracks.length}|${state.clips.length}|${state.assets.length}|${state.clips.map((c) => `${c.id}:${c.start}:${c.duration}:${c.effects?.length || 0}`).join(',')}`;

  if (fingerprint === lastSerializedState) return;
  lastSerializedState = fingerprint;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    state.saveCurrentProject();
  }, 800);
});

if (typeof window !== 'undefined') {
  (window as any).__editorStore = useEditorStore;
}
