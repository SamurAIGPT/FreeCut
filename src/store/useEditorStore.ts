import { create } from 'zustand';
import { AspectRatio, Clip, MediaAsset, Track, TrackType, Transform } from '@/types/editor';

interface HistorySnapshot {
  tracks: Track[];
  clips: Clip[];
}

interface EditorState {
  projectTitle: string;
  aspectRatio: AspectRatio;
  tracks: Track[];
  clips: Clip[];
  assets: MediaAsset[];
  playhead: number;
  duration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  zoom: number; // Pixels per second (e.g. 60)
  isSnapping: boolean;

  // History
  history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };

  // Actions
  setProjectTitle: (title: string) => void;
  setAspectRatio: (aspect: AspectRatio) => void;
  setPlayhead: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setSelectedClipId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  toggleSnapping: () => void;
  
  // Asset Management
  addAsset: (asset: MediaAsset) => void;

  // Track Management
  addTrack: (type: TrackType) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;

  // Clip Operations
  addClip: (clipData: Omit<Clip, 'id'>) => string;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  updateClipTransform: (id: string, updates: Partial<Transform>) => void;
  splitClip: (clipId: string, splitTime?: number) => void;
  deleteClip: (clipId: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

const DEFAULT_TRACKS: Track[] = [
  { id: 'track-text-1', name: 'Text / Overlays', type: 'text', isVisible: true },
  { id: 'track-video-1', name: 'Main Video', type: 'video', isVisible: true },
  { id: 'track-audio-1', name: 'Audio Track', type: 'audio', isVisible: true, isMuted: false },
];

export const useEditorStore = create<EditorState>((set, get) => ({
  projectTitle: 'My FreeCut Project',
  aspectRatio: '16:9',
  tracks: DEFAULT_TRACKS,
  clips: [],
  assets: [],
  playhead: 0,
  duration: 15, // Default empty timeline is 15s
  isPlaying: false,
  selectedClipId: null,
  zoom: 80, // 80px per second
  isSnapping: true,
  history: { past: [], future: [] },

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
  setZoom: (zoom) => set({ zoom: Math.max(20, Math.min(zoom, 300)) }),
  toggleSnapping: () => set((state) => ({ isSnapping: !state.isSnapping })),

  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),

  addTrack: (type) => {
    const newTrack: Track = {
      id: `track-${type}-${Date.now()}`,
      name: `${type.toUpperCase()} Track ${get().tracks.filter((t) => t.type === type).length + 1}`,
      type,
      isVisible: true,
    };
    set((state) => ({ tracks: [...state.tracks, newTrack] }));
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

  addClip: (clipData) => {
    const state = get();
    const newId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newClip: Clip = {
      ...clipData,
      id: newId,
    };

    // Calculate new total duration if this clip extends beyond current duration
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
    const currentClip = state.clips.find((c) => c.id === id);
    if (!currentClip) return;

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

  splitClip: (clipId, customSplitTime) => {
    const state = get();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const splitAt = customSplitTime ?? state.playhead;
    // Check if playhead is strictly inside the clip
    if (splitAt <= clip.start || splitAt >= clip.start + clip.duration) return;

    const firstDuration = splitAt - clip.start;
    const secondDuration = clip.duration - firstDuration;

    // Snapshot history
    const past = [...state.history.past, { tracks: state.tracks, clips: state.clips }];

    const firstClip: Clip = {
      ...clip,
      duration: firstDuration,
      trimEnd: clip.trimStart + firstDuration,
    };

    const secondClip: Clip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${clip.name} (Split)`,
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
