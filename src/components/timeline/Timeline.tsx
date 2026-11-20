import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut, MousePointer, 
  Copy, Link2, Bookmark, Sparkles, AlignLeft, AlignRight, Maximize2,
  Film, Video, Music, Type, Wand2, CheckCircle2, Eye, EyeOff, Volume2, VolumeX, Lock, Unlock, ClipboardPaste, X, Snowflake
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { TrackHeader } from './TrackHeader';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';
import { ClipItem } from './ClipItem';
import { Tooltip } from '@/components/ui/Tooltip';
import { timelineDragSource, TimelineDragData } from '@/utils/dragSource';
import { importMediaFiles } from '@/utils/mediaImporter';
import { formatTimecode } from '@/utils/time';
import { generateSoundEffect } from '@/utils/sampleMedia';
import { Track, TrackType } from '@/types/editor';

interface DropTargetState {
  trackId: string | null;
  trackIndex: number;
  time: number;
  duration: number;
  isNewTrack: boolean;
  newTrackType?: TrackType;
  targetClipId?: string | null;
  isExternalFiles: boolean;
  activeData: TimelineDragData | null;
}

export const Timeline: React.FC = () => {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dropTarget, setDropTarget] = useState<DropTargetState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [trackContextMenu, setTrackContextMenu] = useState<{
    track: Track;
    x: number;
    y: number;
    time: number;
  } | null>(null);
  const [emptyContextMenu, setEmptyContextMenu] = useState<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  useEffect(() => {
    const handleClose = () => {
      setTrackContextMenu(null);
      setEmptyContextMenu(null);
    };
    if (trackContextMenu || emptyContextMenu) {
      window.addEventListener('click', handleClose);
      window.addEventListener('contextmenu', handleClose);
      window.addEventListener('resize', handleClose);
    }
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
      window.removeEventListener('resize', handleClose);
    };
  }, [trackContextMenu, emptyContextMenu]);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const zoom = useEditorStore((s) => s.zoom);
  const duration = useEditorStore((s) => s.duration);
  const playhead = useEditorStore((s) => s.playhead);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelectedClipId = useEditorStore((s) => s.setSelectedClipId);
  const copiedClip = useEditorStore((s) => s.copiedClip);
  const copyClip = useEditorStore((s) => s.copyClip);
  const pasteClip = useEditorStore((s) => s.pasteClip);
  const deleteTrack = useEditorStore((s) => s.deleteTrack);
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute);
  const toggleTrackLock = useEditorStore((s) => s.toggleTrackLock);
  const toggleTrackVisibility = useEditorStore((s) => s.toggleTrackVisibility);
  const splitClip = useEditorStore((s) => s.splitClip);
  const splitLeft = useEditorStore((s) => s.splitLeft);
  const splitRight = useEditorStore((s) => s.splitRight);
  const duplicateClip = useEditorStore((s) => s.duplicateClip);
  const extractAudio = useEditorStore((s) => s.extractAudio);
  const rippleDelete = useEditorStore((s) => s.rippleDelete);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const addMarker = useEditorStore((s) => s.addMarker);
  const markers = useEditorStore((s) => s.markers);
  const setZoom = useEditorStore((s) => s.setZoom);
  const isSnapping = useEditorStore((s) => s.isSnapping);
  const toggleSnapping = useEditorStore((s) => s.toggleSnapping);
  const addTrack = useEditorStore((s) => s.addTrack);
  const addClip = useEditorStore((s) => s.addClip);
  const updateClip = useEditorStore((s) => s.updateClip);
  const addClipEffect = useEditorStore((s) => s.addClipEffect);
  const addAsset = useEditorStore((s) => s.addAsset);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const snapGuideX = useEditorStore((s) => s.snapGuideX);
  const setSnapGuideX = useEditorStore((s) => s.setSnapGuideX);

  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const isVideoSelected = selectedClip?.type === 'video';

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const getTimeFromClientX = (clientX: number) => {
    if (!containerRef.current) return playhead;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollX = containerRef.current.scrollLeft;
    const x = Math.max(0, clientX - rect.left + scrollX);
    return Math.max(0, x / zoom);
  };

  const handleFitToZoom = () => {
    if (!containerRef.current) return;
    const viewportWidth = containerRef.current.clientWidth - 40;
    const effectiveDuration = Math.max(duration, 5);
    const newZoom = Math.min(250, Math.max(25, viewportWidth / effectiveDuration));
    setZoom(Math.round(newZoom));
  };

  const TRACK_HEIGHT = 40;
  const timelineHeight = tracks.length * TRACK_HEIGHT + 32;

  // ==================== DRAG & DROP HANDLERS ====================

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isFiles = e.dataTransfer?.types ? Array.from(e.dataTransfer.types).includes('Files') : false;
    const activeData = timelineDragSource.getActive();

    if (!activeData && !isFiles) return;

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;

    // Mouse coordinates relative to timeline tracks area (subtract 32px ruler offset)
    const mouseX = Math.max(0, e.clientX - rect.left + scrollLeft);
    const mouseY = Math.max(0, e.clientY - rect.top + scrollTop - 32);

    let time = Math.max(0, mouseX / zoom);

    // Magnetic Snapping
    if (isSnapping) {
      const snapThreshold = 12 / zoom;
      const snapTargets = [
        useEditorStore.getState().playhead,
        ...markers.map((m) => m.time),
        ...clips.flatMap((c) => [c.start, c.start + c.duration]),
      ];

      for (const target of snapTargets) {
        if (Math.abs(time - target) < snapThreshold) {
          time = target;
          setSnapGuideX(target);
          break;
        }
      }
    }

    const trackIndex = Math.max(0, Math.floor(mouseY / TRACK_HEIGHT));
    const isNewTrack = trackIndex >= tracks.length;

    let newTrackType: TrackType = 'video';
    if (activeData) {
      if (activeData.type === 'audio') newTrackType = 'audio';
      else if (activeData.type === 'text' || activeData.type === 'sticker') newTrackType = 'text';
      else newTrackType = 'video';
    } else if (isFiles) {
      newTrackType = 'video';
    }

    const hoveredTrack = !isNewTrack ? tracks[trackIndex] : null;
    let targetClipId: string | null = null;

    if (hoveredTrack) {
      const trackClips = clips.filter((c) => c.trackId === hoveredTrack.id);
      const hit = trackClips.find((c) => c.start <= time && time <= c.start + c.duration);
      if (hit) {
        targetClipId = hit.id;
      }
    }

    let itemDuration = 4.0;
    if (activeData?.duration) {
      itemDuration = activeData.duration;
    } else if (activeData?.type === 'audio') {
      itemDuration = 3.0;
    } else if (activeData?.type === 'text' || activeData?.type === 'sticker') {
      itemDuration = 3.5;
    }

    setDropTarget({
      trackId: hoveredTrack ? hoveredTrack.id : null,
      trackIndex,
      time,
      duration: itemDuration,
      isNewTrack,
      newTrackType,
      targetClipId,
      isExternalFiles: isFiles && !activeData,
      activeData,
    });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setDropTarget(null);
      setSnapGuideX(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDrop = dropTarget;
    setDropTarget(null);
    setSnapGuideX(null);

    // 1. Files dropped from OS
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const startTime = currentDrop
        ? currentDrop.time
        : Math.max(0, (e.clientX - (containerRef.current?.getBoundingClientRect().left || 0) + (containerRef.current?.scrollLeft || 0)) / zoom);

      try {
        const imported = await importMediaFiles(files);
        let currTime = startTime;

        for (const asset of imported) {
          addAsset(asset);
          const reqType: TrackType = asset.type === 'audio' ? 'audio' : 'video';

          let track = currentDrop?.trackId ? tracks.find((t) => t.id === currentDrop.trackId) : null;
          if (!track || track.type !== reqType) {
            track = tracks.find((t) => t.type === reqType) || null;
          }

          const targetTrackId = track ? track.id : addTrack(reqType, reqType === 'audio' ? 'Audio Track' : 'Video Track');

          addClip({
            trackId: targetTrackId,
            assetId: asset.id,
            name: asset.name,
            type: asset.type,
            start: currTime,
            duration: asset.duration,
            trimStart: 0,
            trimEnd: asset.duration,
            transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
            volume: asset.type === 'audio' ? 0.9 : 1,
            color: asset.type === 'audio' ? '#059669' : '#2563eb',
            thumbnailUrl: asset.thumbnailUrl,
            url: asset.url,
          });

          currTime += asset.duration;
        }

        showToast(`Imported & placed ${imported.length} file(s) on timeline`);
      } catch (err) {
        console.error('File drop error:', err);
      }
      return;
    }

    if (!currentDrop) return;
    const { time, duration: itemDuration, isNewTrack, targetClipId, activeData } = currentDrop;

    if (!activeData) return;

    // 2. Effect dropped on clip or timeline
    if (activeData.type === 'effect') {
      const fx = activeData.payload;
      if (targetClipId) {
        addClipEffect(targetClipId, {
          name: fx.name,
          type: fx.effectType || 'blur',
          enabled: true,
          ...fx.defaultParam,
        });
        if (fx.filter) {
          updateClip(targetClipId, { filter: fx.filter });
        }
        showToast(`Applied "${fx.name}" effect to clip`);
      } else {
        let track = !isNewTrack && currentDrop.trackId ? tracks.find((t) => t.id === currentDrop.trackId) : null;
        if (!track || track.type !== 'video') {
          track = tracks.find((t) => t.type === 'video') || null;
        }
        const targetTrackId = track ? track.id : addTrack('video', 'FX Track');
        addClip({
          trackId: targetTrackId,
          name: `${fx.name} Layer`,
          type: 'effect',
          start: time,
          duration: 4.0,
          trimStart: 0,
          trimEnd: 4.0,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 0,
          color: '#ec4899',
          filter: fx.filter,
          effects: [{
            id: `effect-${Date.now()}`,
            name: fx.name,
            type: fx.effectType || 'blur',
            enabled: true,
            ...fx.defaultParam,
          }],
        });
        showToast(`Added "${fx.name}" layer at ${formatTimecode(time)}`);
      }
      timelineDragSource.end();
      return;
    }

    // 3. Transition dropped on clip
    if (activeData.type === 'transition') {
      const tr = activeData.payload;
      if (targetClipId) {
        updateClip(targetClipId, {
          transitionIn: { type: tr.type, duration: 1.0 },
        });
        showToast(`Applied "${tr.name}" transition to clip`);
      } else {
        showToast(`Drop transition onto an existing clip to apply`);
      }
      timelineDragSource.end();
      return;
    }

    // 4. Audio
    if (activeData.type === 'audio') {
      let track = !isNewTrack && currentDrop.trackId ? tracks.find((t) => t.id === currentDrop.trackId) : null;
      if (!track || track.type !== 'audio') {
        track = tracks.find((t) => t.type === 'audio') || null;
      }
      const targetTrackId = track ? track.id : addTrack('audio', 'Audio Track');

      if (activeData.payload?.soundType) {
        const sfx = activeData.payload;
        const asset = await generateSoundEffect(sfx.soundType, `${activeData.name}.wav`, activeData.duration || 3.0);
        addAsset(asset);
        addClip({
          trackId: targetTrackId,
          assetId: asset.id,
          name: activeData.name,
          type: 'audio',
          start: time,
          duration: asset.duration,
          trimStart: 0,
          trimEnd: asset.duration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 0.9,
          color: '#059669',
        });
      } else {
        addClip({
          trackId: targetTrackId,
          assetId: activeData.id,
          name: activeData.name,
          type: 'audio',
          start: time,
          duration: itemDuration,
          trimStart: 0,
          trimEnd: itemDuration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 0.9,
          color: '#059669',
          url: activeData.url,
        });
      }
      showToast(`Added "${activeData.name}" to audio track`);
      timelineDragSource.end();
      return;
    }

    // 5. Text Preset
    if (activeData.type === 'text') {
      let track = !isNewTrack && currentDrop.trackId ? tracks.find((t) => t.id === currentDrop.trackId) : null;
      if (!track || track.type !== 'text') {
        track = tracks.find((t) => t.type === 'text') || null;
      }
      const targetTrackId = track ? track.id : addTrack('text', 'Text Track');
      const preset = activeData.payload || {};

      addClip({
        trackId: targetTrackId,
        name: activeData.name,
        type: 'text',
        text: preset.text || activeData.name,
        fontSize: preset.fontSize || 48,
        fontColor: preset.fontColor || '#ffffff',
        backgroundColor: preset.bg || 'transparent',
        fontFamily: 'Inter, system-ui',
        start: time,
        duration: itemDuration,
        trimStart: 0,
        trimEnd: itemDuration,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        volume: 1,
        color: preset.color || '#d97706',
        textAlign: 'center',
      });
      showToast(`Added text "${activeData.name}" to track`);
      timelineDragSource.end();
      return;
    }

    // 6. Sticker
    if (activeData.type === 'sticker') {
      let track = !isNewTrack && currentDrop.trackId ? tracks.find((t) => t.id === currentDrop.trackId) : null;
      if (!track || track.type !== 'text') {
        track = tracks.find((t) => t.type === 'text') || null;
      }
      const targetTrackId = track ? track.id : addTrack('text', 'Stickers');
      const sticker = activeData.payload || {};

      addClip({
        trackId: targetTrackId,
        name: activeData.name,
        type: 'text',
        text: sticker.display || '⭐',
        fontSize: 96,
        fontColor: '#ffffff',
        backgroundColor: 'transparent',
        start: time,
        duration: itemDuration,
        trimStart: 0,
        trimEnd: itemDuration,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        volume: 1,
        color: '#e11d48',
        textAlign: 'center',
      });
      showToast(`Added sticker "${activeData.name}" to track`);
      timelineDragSource.end();
      return;
    }

    // 7. Media (Video / Image)
    if (activeData.type === 'media') {
      const isAudioMedia = activeData.mediaType === 'audio';
      const targetType: TrackType = isAudioMedia ? 'audio' : 'video';

      let track = !isNewTrack && currentDrop.trackId ? tracks.find((t) => t.id === currentDrop.trackId) : null;
      if (!track || track.type !== targetType) {
        track = tracks.find((t) => t.type === targetType) || null;
      }
      const targetTrackId = track ? track.id : addTrack(targetType, targetType === 'audio' ? 'Audio Track' : 'Video Track');

      addClip({
        trackId: targetTrackId,
        assetId: activeData.id,
        name: activeData.name,
        type: activeData.mediaType || 'video',
        start: time,
        duration: itemDuration,
        trimStart: 0,
        trimEnd: itemDuration,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        volume: 1,
        color: isAudioMedia ? '#059669' : '#2563eb',
        thumbnailUrl: activeData.thumbnailUrl,
        url: activeData.url,
      });
      showToast(`Added ${activeData.name} to ${track ? track.name : 'track'}`);
      timelineDragSource.end();
      return;
    }
  };

  return (
    <div className="relative flex h-56 sm:h-64 lg:h-72 w-full shrink-0 flex-col border-t border-app-border bg-app-bg select-none transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] px-4 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 shadow-2xl animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* External Files Drop Banner */}
      {dropTarget?.isExternalFiles && (
        <div className="pointer-events-none absolute top-14 inset-x-8 z-50 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-500 bg-blue-500/20 py-2.5 text-xs font-bold text-blue-500 dark:text-blue-300 backdrop-blur-md shadow-2xl animate-pulse">
          <Film className="h-4 w-4" />
          <span>Drop media files to insert onto timeline at {formatTimecode(dropTarget.time)}</span>
        </div>
      )}

      {/* Timeline Control Bar (Clean Icon-Only Buttons with Rich Tooltips) */}
      <div className="flex h-10 w-full items-center justify-between border-b border-app-border bg-app-surface px-2.5 gap-1 overflow-x-auto scrollbar-hidden">
        {/* Left Section: Icon-Only Editing Tools matching reference project with Tooltips */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Tool Modes: Select (V) & Razor (C) */}
          <div className="flex items-center gap-0.5">
            <Tooltip content="Selection Tool" shortcut="V" side="top">
              <button
                onClick={() => setActiveTool('select')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition cursor-pointer ${
                  activeTool === 'select'
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60'
                }`}
              >
                <MousePointer className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Razor Tool (Click clip to cut)" shortcut="C" side="top">
              <button
                onClick={() => setActiveTool('razor')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition cursor-pointer ${
                  activeTool === 'razor'
                    ? 'bg-red-500/20 text-red-500 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60'
                }`}
              >
                <Scissors className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Core Editing Actions: Split (S), Split Left (Q), Split Right (W), Extract Audio, Duplicate (Ctrl+D), Freeze Frame, Ripple Delete (Shift+Del), Delete (Del) */}
          <div className="flex items-center gap-0.5">
            <Tooltip content="Split element at playhead" shortcut="S" side="top">
              <button
                onClick={() => selectedClipId && splitClip(selectedClipId)}
                disabled={!selectedClipId}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <Scissors className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Split left (Trim start to playhead)" shortcut="Q" side="top">
              <button
                onClick={() => selectedClipId && splitLeft(selectedClipId)}
                disabled={!selectedClipId}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Split right (Trim end to playhead)" shortcut="W" side="top">
              <button
                onClick={() => selectedClipId && splitRight(selectedClipId)}
                disabled={!selectedClipId}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content={isVideoSelected ? "Extract / Separate audio" : "Select video to extract audio"} side="top">
              <button
                onClick={() => selectedClipId && isVideoSelected && extractAudio(selectedClipId)}
                disabled={!selectedClipId || !isVideoSelected}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <Link2 className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Duplicate element" shortcut="Ctrl+D" side="top">
              <button
                onClick={() => selectedClipId && duplicateClip(selectedClipId)}
                disabled={!selectedClipId}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <Copy className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Freeze frame (coming soon)" side="top">
              <button
                disabled={true}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 opacity-40 cursor-not-allowed dark:text-neutral-400"
              >
                <Snowflake className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Ripple delete (Close gap)" shortcut="Shift+Del" side="top">
              <button
                onClick={() => selectedClipId && rippleDelete(selectedClipId)}
                disabled={!selectedClipId}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Delete element" shortcut="Del" side="top">
              <button
                onClick={() => selectedClipId && deleteClip(selectedClipId)}
                disabled={!selectedClipId}
                className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:text-red-600 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition cursor-pointer dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/15"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Timeline Controls: Bookmark / Marker (M) & Snapping (N) */}
          <div className="flex items-center gap-0.5">
            <Tooltip content="Add bookmark / marker" shortcut="M" side="top">
              <button
                onClick={() => addMarker(useEditorStore.getState().playhead)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition cursor-pointer dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content={isSnapping ? "Auto snapping ON" : "Auto snapping OFF"} shortcut="N" side="top">
              <button
                onClick={toggleSnapping}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition cursor-pointer ${
                  isSnapping
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60'
                }`}
              >
                <Magnet className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Quick Add Track Buttons (Icon Only with tooltips) */}
          <div className="flex items-center gap-0.5">
            <Tooltip content="Add Video Track" side="top">
              <button
                onClick={() => addTrack('video')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 transition cursor-pointer dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/15"
              >
                <Video className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Add Audio Track" side="top">
              <button
                onClick={() => addTrack('audio')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 transition cursor-pointer dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/15"
              >
                <Music className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Add Text Track" side="top">
              <button
                onClick={() => addTrack('text')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 transition cursor-pointer dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-500/15"
              >
                <Type className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Right Section: Zoom & Scale Controls with Tooltips */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-2">
          <Tooltip content="Fit timeline to screen" side="top">
            <button
              onClick={handleFitToZoom}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="Zoom Out" side="top">
            <button
              onClick={() => setZoom(zoom - 20)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </Tooltip>

          <input
            type="range"
            min={25}
            max={250}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-20 accent-neutral-900 dark:accent-neutral-100"
          />

          <Tooltip content="Zoom In" side="top">
            <button
              onClick={() => setZoom(zoom + 20)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main Timeline Workspace (Fixed Left Headers + Horizontally Scrollable Lanes) */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Track Control Headers */}
        <div className="flex w-60 shrink-0 flex-col border-r border-app-border bg-app-surface select-none z-30 transition-colors duration-200">
          <div className="flex h-8 items-center justify-between border-b border-app-border px-3 text-[11px] font-bold tracking-wider text-app-text-muted uppercase">
            <span>Tracks ({tracks.length})</span>
            <span className="font-mono text-[9px] opacity-60 lowercase">scroll ↕</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTrackContextMenu({
                    track,
                    x: e.clientX,
                    y: e.clientY,
                    time: playhead,
                  });
                }}
              >
                <TrackHeader 
                  track={track} 
                  index={idx} 
                  totalTracks={tracks.length} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas Area */}
        <div
          id="timeline-tracks-container"
          ref={containerRef}
          onScroll={handleScroll}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative flex-1 overflow-x-auto overflow-y-auto bg-app-bg"
        >
          {/* Time Ruler with Interactive Moving Markers */}
          <TimeRuler
            scrollLeft={scrollLeft}
            timelineHeight={Math.max(timelineHeight, (tracks.length + (dropTarget?.isNewTrack ? 1 : 0)) * TRACK_HEIGHT + 32)}
          />

          {/* Scrubbing Playhead Needle */}
          <Playhead timelineHeight={Math.max(timelineHeight, (tracks.length + (dropTarget?.isNewTrack ? 1 : 0)) * TRACK_HEIGHT + 32)} />

          {/* Magnetic Vertical Snap Guide Line */}
          {snapGuideX !== null && (
            <div
              style={{
                transform: `translate3d(${Math.round(snapGuideX * zoom)}px, 0, 0)`,
                height: `${timelineHeight}px`,
                willChange: 'transform',
              }}
              className="pointer-events-none absolute top-0 left-0 z-40 w-px bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            >
              <div className="absolute top-0 -left-1.5 h-3 w-3 rounded-full bg-cyan-400" />
            </div>
          )}

          {/* Multi-Track Rows and Clip Drop Targets */}
          <div style={{ width: `${Math.max(duration + 15, (dropTarget?.time || 0) + (dropTarget?.duration || 0) + 10) * zoom}px` }} className="relative">
            {tracks.map((track, idx) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);
              const isTrackEmpty = trackClips.length === 0;
              const isTrackHovered = dropTarget && !dropTarget.isNewTrack && dropTarget.trackId === track.id;

              return (
                <div
                  key={track.id}
                  data-track-id={track.id}
                  style={{ height: `${TRACK_HEIGHT}px` }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const t = getTimeFromClientX(e.clientX);
                    setTrackContextMenu({
                      track,
                      x: e.clientX,
                      y: e.clientY,
                      time: t,
                    });
                  }}
                  className={`relative border-b transition-colors duration-150 ${
                    isTrackHovered
                      ? 'border-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/15 ring-1 ring-cyan-400/60'
                      : 'border-neutral-200 bg-white/70 hover:bg-white dark:border-[#222226] dark:bg-[#0c0c0e]/80 dark:hover:bg-[#141418]'
                  }`}
                >
                  {/* Empty Track Dashed Dropzone */}
                  {isTrackEmpty && !isTrackHovered && (
                    <div className="pointer-events-none absolute inset-x-3 inset-y-1 flex items-center justify-center rounded border border-dashed border-neutral-300 text-[10px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                      Empty {track.type} track — Drag clips or items here
                    </div>
                  )}

                  {/* Render Track Clips */}
                  {trackClips.map((clip) => (
                    <ClipItem 
                      key={clip.id} 
                      clip={clip} 
                      isLocked={track.isLocked} 
                      isDropTarget={clip.id === dropTarget?.targetClipId}
                    />
                  ))}

                  {/* Drop Indicator Line on Hovered Track */}
                  {isTrackHovered && (
                    <div
                      style={{ transform: `translate3d(${Math.round(dropTarget.time * zoom)}px, 0, 0)` }}
                      className="pointer-events-none absolute top-0 bottom-0 z-35 w-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
                    >
                      <div className="absolute top-0 -left-1.5 h-3 w-3 rounded-full bg-cyan-400 shadow-md flex items-center justify-center">
                        <div className="h-1 w-1 rounded-full bg-white" />
                      </div>
                    </div>
                  )}

                  {/* Ghost Placement Preview Box on Hovered Track */}
                  {isTrackHovered && (
                    <div
                      style={{
                        transform: `translate3d(${Math.round(dropTarget.time * zoom)}px, 0, 0)`,
                        width: `${Math.max(36, dropTarget.duration * zoom)}px`,
                      }}
                      className="pointer-events-none absolute inset-y-1 z-30 flex items-center justify-between rounded-md border-2 border-dashed border-cyan-400 bg-cyan-500/25 px-2 backdrop-blur-xs text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse select-none overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 truncate text-[11px] font-bold">
                        {dropTarget.activeData?.type === 'audio' && <Music className="h-3.5 w-3.5 text-emerald-300 shrink-0" />}
                        {dropTarget.activeData?.type === 'text' && <Type className="h-3.5 w-3.5 text-amber-300 shrink-0" />}
                        {dropTarget.activeData?.type === 'effect' && <Sparkles className="h-3.5 w-3.5 text-pink-300 shrink-0" />}
                        {dropTarget.activeData?.type === 'transition' && <Wand2 className="h-3.5 w-3.5 text-purple-300 shrink-0" />}
                        {(!dropTarget.activeData || dropTarget.activeData.type === 'media' || dropTarget.activeData.type === 'sticker') && (
                          <Film className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                        )}
                        <span className="truncate text-cyan-100">{dropTarget.activeData?.name || 'Drop Media'}</span>
                      </div>
                      <span className="shrink-0 rounded bg-cyan-950/80 px-1 py-0.5 font-mono text-[9px] font-semibold text-cyan-300">
                        {dropTarget.duration.toFixed(1)}s
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ghost New Track Drop Zone below existing tracks */}
            {dropTarget && dropTarget.isNewTrack && (
              <div
                style={{ height: `${TRACK_HEIGHT}px` }}
                className="relative border-2 border-dashed border-cyan-400 bg-cyan-500/10 flex items-center justify-center rounded-lg mt-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1.5 text-cyan-500 animate-bounce" />
                <span>
                  Drop here to create new {dropTarget.newTrackType?.toUpperCase() || 'VIDEO'} track at {formatTimecode(dropTarget.time)}
                </span>
              </div>
            )}

            {/* Clickable empty timeline area below tracks */}
            <div
              className="h-36 w-full cursor-default"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const t = getTimeFromClientX(e.clientX);
                setEmptyContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  time: t,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Track Right-Click Context Menu */}
      {trackContextMenu && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setTrackContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setTrackContextMenu(null);
          }}
        >
          <div
            style={{
              position: 'fixed',
              left: Math.max(10, Math.min(window.innerWidth - 230, trackContextMenu.x)),
              top: Math.max(10, Math.min(window.innerHeight - 340, trackContextMenu.y)),
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-md text-neutral-900 dark:text-neutral-100 select-none animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 mb-1 flex items-center justify-between">
              <span className="truncate">{trackContextMenu.track.name}</span>
              <span className="shrink-0 uppercase text-[9px] opacity-60 ml-2">{trackContextMenu.track.type}</span>
            </div>

            {/* Paste Elements */}
            <button
              disabled={!copiedClip}
              onClick={() => {
                pasteClip(trackContextMenu.track.id, trackContextMenu.time);
                showToast(`Pasted "${copiedClip?.name}" to track`);
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ClipboardPaste className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Paste elements</span>
              </div>
              <kbd className="text-[10px] text-app-text-muted">Ctrl+V</kbd>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Mute Track */}
            {trackContextMenu.track.type !== 'text' && (
              <button
                onClick={() => {
                  toggleTrackMute(trackContextMenu.track.id);
                  setTrackContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {trackContextMenu.track.isMuted ? (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                )}
                <span>{trackContextMenu.track.isMuted ? 'Unmute Track' : 'Mute Track'}</span>
              </button>
            )}

            {/* Hide / Show Track */}
            <button
              onClick={() => {
                toggleTrackVisibility(trackContextMenu.track.id);
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              {trackContextMenu.track.isVisible === false ? (
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              )}
              <span>{trackContextMenu.track.isVisible === false ? 'Show Track' : 'Hide Track'}</span>
            </button>

            {/* Lock / Unlock Track */}
            <button
              onClick={() => {
                toggleTrackLock(trackContextMenu.track.id);
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              {trackContextMenu.track.isLocked ? (
                <Unlock className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              )}
              <span>{trackContextMenu.track.isLocked ? 'Unlock Track' : 'Lock Track'}</span>
            </button>

            {/* Delete Track */}
            <button
              disabled={tracks.length <= 1}
              onClick={() => {
                deleteTrack(trackContextMenu.track.id);
                showToast(`Deleted track`);
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 disabled:opacity-40 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Delete Track</span>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Add Tracks */}
            <button
              onClick={() => {
                addTrack('video', 'Video Track');
                showToast('Added video track');
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Film className="h-3.5 w-3.5 text-blue-500" />
              <span>Add Video Track</span>
            </button>

            <button
              onClick={() => {
                addTrack('audio', 'Audio Track');
                showToast('Added audio track');
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Music className="h-3.5 w-3.5 text-emerald-500" />
              <span>Add Audio Track</span>
            </button>

            <button
              onClick={() => {
                addTrack('text', 'Text Track');
                showToast('Added text track');
                setTrackContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Type className="h-3.5 w-3.5 text-amber-500" />
              <span>Add Text Track</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Empty Timeline Right-Click Context Menu */}
      {emptyContextMenu && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setEmptyContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setEmptyContextMenu(null);
          }}
        >
          <div
            style={{
              position: 'fixed',
              left: Math.max(10, Math.min(window.innerWidth - 220, emptyContextMenu.x)),
              top: Math.max(10, Math.min(window.innerHeight - 250, emptyContextMenu.y)),
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-52 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-md text-neutral-900 dark:text-neutral-100 select-none animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 mb-1">
              Timeline Space
            </div>

            {/* Paste */}
            <button
              disabled={!copiedClip}
              onClick={() => {
                pasteClip(undefined, emptyContextMenu.time);
                showToast(`Pasted "${copiedClip?.name}"`);
                setEmptyContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ClipboardPaste className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Paste elements</span>
              </div>
              <kbd className="text-[10px] text-app-text-muted">Ctrl+V</kbd>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Add Tracks */}
            <button
              onClick={() => {
                addTrack('video', 'Video Track');
                showToast('Added video track');
                setEmptyContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Film className="h-3.5 w-3.5 text-blue-500" />
              <span>Add Video Track</span>
            </button>

            <button
              onClick={() => {
                addTrack('audio', 'Audio Track');
                showToast('Added audio track');
                setEmptyContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Music className="h-3.5 w-3.5 text-emerald-500" />
              <span>Add Audio Track</span>
            </button>

            <button
              onClick={() => {
                addTrack('text', 'Text Track');
                showToast('Added text track');
                setEmptyContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Type className="h-3.5 w-3.5 text-amber-500" />
              <span>Add Text Track</span>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Clear Selection */}
            <button
              onClick={() => {
                setSelectedClipId(null);
                setEmptyContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Selection</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Timeline;
