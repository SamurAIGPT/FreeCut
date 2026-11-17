import { create } from 'zustand';
import { AspectRatio, Clip, ColorFilter, MediaAsset, SidebarTab, Track, TrackType, Transform } from '@/types/editor';

interface HistorySnapshot {
  tracks: Track[];
  clips: Clip[];
}

export type ThemeMode = 'dark' | 'light';

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
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setActiveTool: (tool: 'select' | 'razor') => void;
  setCanvasZoom: (zoom: number) => void;
  toggleShowGrid: () => void;
  
  // Asset Management
  addAsset: (asset: MediaAsset) => void;

  // Track Management
  addTrack: (type: TrackType) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;

  // Clip Operations
  addClip: (clipData: Omit<Clip, 'id'>) => string;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  updateClipTransform: (id: string, updates: Partial<Transform>) => void;
  updateClipFilter: (id: string, updates: Partial<ColorFilter>) => void;
  splitClip: (clipId: string, splitTime?: number) => void;
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

const getInitialTheme = (): ThemeMode => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('freecut_theme') : null;
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark'; // Pure dark default
};

export const useEditorStore = create<EditorState>((set, get) => ({
  theme: getInitialTheme(),
  projectTitle: 'Cyberpunk Trailer Project',
  aspectRatio: '16:9',
  tracks: DEFAULT_TRACKS,
  clips: [],
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
    set({ playhead: clamped });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(zoom, 300)) }),
  toggleSnapping: () => set((state) => ({ isSnapping: !state.isSnapping })),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
  toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),

  addTrack: (type) => {
    const newTrack: Track = {
      id: `track-${type}-${Date.now()}`,
      name: `${type.toUpperCase()} Track ${get().tracks.filter((t) => t.type === type).length + 1}`,
      type,
      isVisible: true,
    };
    set((state) => ({ tracks: [newTrack, ...state.tracks] }));
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
    const newDuration = Math.max(state.duration, clipEnd + 5);

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
    const maxEnd = Math.max(...updatedClips.map((c) => c.start + c.duration), 15);

    set({
      clips: updatedClips,
      duration: Math.max(maxEnd + 5, 15),
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
