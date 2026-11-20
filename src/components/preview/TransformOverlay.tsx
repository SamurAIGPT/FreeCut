import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { compositor } from '@/engine/compositor';
import { Clip } from '@/types/editor';

interface TransformOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const TransformOverlay: React.FC<TransformOverlayProps> = ({ canvasRef }) => {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelectedClipId = useEditorStore((s) => s.setSelectedClipId);
  const playhead = useEditorStore((s) => s.playhead);
  const aspect = useEditorStore((s) => s.aspectRatio);
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform);

  const [snapLines, setSnapLines] = useState<{ x?: boolean; y?: boolean }>({});
  const [activeDrag, setActiveDrag] = useState<'move' | 'scale' | 'rotate' | 'edge' | null>(null);
  const [metricBadge, setMetricBadge] = useState<string | null>(null);

  // Drag session ref to store mouse start and initial transform
  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    initialTransformX: number;
    initialTransformY: number;
    initialScale: number;
    initialRotation: number;
    initialScaleX: number;
    initialScaleY: number;
    screenCenterX: number;
    screenCenterY: number;
    handleCorner?: string;
    handleEdge?: string;
    scaleFactor: number;
  } | null>(null);

  // 1. Find active visible clips at playhead
  const visibleTrackIds = new Set(tracks.filter((t) => t.isVisible !== false).map((t) => t.id));
  const activeClips = clips.filter((clip) => {
    if (clip.isHidden) return false;
    if (!visibleTrackIds.has(clip.trackId)) return false;
    return playhead >= clip.start && playhead < clip.start + clip.duration;
  });

  // Selected clip must be active and visual (video, image, text)
  const selectedClip = activeClips.find(
    (c) => c.id === selectedClipId && (c.type === 'video' || c.type === 'image' || c.type === 'text')
  );

  // Helper to get base canvas dimensions
  const baseDim = compositor.getDimensions(aspect);

  // Compute scale factor between DOM canvas element and logical base dimensions
  const getScaleFactor = useCallback(() => {
    if (!canvasRef.current) return 1;
    return canvasRef.current.clientWidth / baseDim.width;
  }, [canvasRef, baseDim.width]);

  // Compute clip intrinsic bounds (dw, dh) in base canvas coordinates
  const getClipBaseSize = useCallback((clip: Clip): { dw: number; dh: number } => {
    if (clip.type === 'video') {
      const asset = assets.find((a) => a.id === clip.assetId);
      const vWidth = asset?.width || 1280;
      const vHeight = asset?.height || 720;
      const contain = Math.min(baseDim.width / vWidth, baseDim.height / vHeight);
      return { dw: vWidth * contain, dh: vHeight * contain };
    }
    if (clip.type === 'image') {
      const asset = assets.find((a) => a.id === clip.assetId);
      const iWidth = asset?.width || 800;
      const iHeight = asset?.height || 600;
      const contain = Math.min(baseDim.width / iWidth, baseDim.height / iHeight);
      return { dw: iWidth * contain, dh: iHeight * contain };
    }
    if (clip.type === 'text') {
      const textLen = (clip.text || 'Text').length;
      const fontSize = (clip.fontSize || 48) * (baseDim.width / 1920);
      return {
        dw: Math.max(300, textLen * fontSize * 0.55),
        dh: fontSize * 1.5,
      };
    }
    return { dw: 400, dh: 300 };
  }, [assets, baseDim]);

  // Move Drag Handler
  const handleMovePointerDown = (e: React.PointerEvent) => {
    if (!selectedClip || !canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const scaleFactor = getScaleFactor();
    const rect = canvasRef.current.getBoundingClientRect();
    const centerScreenX = rect.left + (baseDim.width / 2 + (selectedClip.transform.x || 0)) * scaleFactor;
    const centerScreenY = rect.top + (baseDim.height / 2 + (selectedClip.transform.y || 0)) * scaleFactor;

    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialTransformX: selectedClip.transform.x || 0,
      initialTransformY: selectedClip.transform.y || 0,
      initialScale: selectedClip.transform.scale ?? 1,
      initialRotation: selectedClip.transform.rotation ?? 0,
      initialScaleX: selectedClip.transform.scaleX ?? selectedClip.transform.scale ?? 1,
      initialScaleY: selectedClip.transform.scaleY ?? selectedClip.transform.scale ?? 1,
      screenCenterX: centerScreenX,
      screenCenterY: centerScreenY,
      scaleFactor,
    };

    setActiveDrag('move');

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;

      const deltaX = (moveEvent.clientX - session.startX) / session.scaleFactor;
      const deltaY = (moveEvent.clientY - session.startY) / session.scaleFactor;

      let nextX = session.initialTransformX + deltaX;
      let nextY = session.initialTransformY + deltaY;

      // Snapping to exact center (0, 0)
      const snapThreshold = 10;
      const snappedX = Math.abs(nextX) < snapThreshold;
      const snappedY = Math.abs(nextY) < snapThreshold;

      if (snappedX) nextX = 0;
      if (snappedY) nextY = 0;

      setSnapLines({ x: snappedX, y: snappedY });
      setMetricBadge(`X: ${Math.round(nextX)}px  Y: ${Math.round(nextY)}px`);

      updateClipTransform(selectedClip.id, {
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dragSessionRef.current = null;
      setActiveDrag(null);
      setSnapLines({});
      setMetricBadge(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Corner Scale Drag Handler
  const handleCornerPointerDown = (corner: string, e: React.PointerEvent) => {
    if (!selectedClip || !canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const scaleFactor = getScaleFactor();
    const rect = canvasRef.current.getBoundingClientRect();
    const centerScreenX = rect.left + (baseDim.width / 2 + (selectedClip.transform.x || 0)) * scaleFactor;
    const centerScreenY = rect.top + (baseDim.height / 2 + (selectedClip.transform.y || 0)) * scaleFactor;

    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialTransformX: selectedClip.transform.x || 0,
      initialTransformY: selectedClip.transform.y || 0,
      initialScale: selectedClip.transform.scale ?? 1,
      initialRotation: selectedClip.transform.rotation ?? 0,
      initialScaleX: selectedClip.transform.scaleX ?? selectedClip.transform.scale ?? 1,
      initialScaleY: selectedClip.transform.scaleY ?? selectedClip.transform.scale ?? 1,
      screenCenterX: centerScreenX,
      screenCenterY: centerScreenY,
      handleCorner: corner,
      scaleFactor,
    };

    setActiveDrag('scale');

    const initialDistance = Math.hypot(e.clientX - centerScreenX, e.clientY - centerScreenY);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;

      const currentDistance = Math.hypot(
        moveEvent.clientX - session.screenCenterX,
        moveEvent.clientY - session.screenCenterY
      );

      const scaleRatio = currentDistance / Math.max(1, initialDistance);
      let newScale = Math.max(0.05, Math.min(8, session.initialScale * scaleRatio));

      // Snap near 100% scale
      if (Math.abs(newScale - 1) < 0.03) {
        newScale = 1;
      }

      setMetricBadge(`Scale: ${(newScale * 100).toFixed(0)}%`);

      updateClipTransform(selectedClip.id, {
        scale: Number(newScale.toFixed(3)),
        scaleX: Number(newScale.toFixed(3)),
        scaleY: Number(newScale.toFixed(3)),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dragSessionRef.current = null;
      setActiveDrag(null);
      setMetricBadge(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Rotation Drag Handler
  const handleRotationPointerDown = (e: React.PointerEvent) => {
    if (!selectedClip || !canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const scaleFactor = getScaleFactor();
    const rect = canvasRef.current.getBoundingClientRect();
    const centerScreenX = rect.left + (baseDim.width / 2 + (selectedClip.transform.x || 0)) * scaleFactor;
    const centerScreenY = rect.top + (baseDim.height / 2 + (selectedClip.transform.y || 0)) * scaleFactor;

    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialTransformX: selectedClip.transform.x || 0,
      initialTransformY: selectedClip.transform.y || 0,
      initialScale: selectedClip.transform.scale ?? 1,
      initialRotation: selectedClip.transform.rotation ?? 0,
      initialScaleX: selectedClip.transform.scaleX ?? 1,
      initialScaleY: selectedClip.transform.scaleY ?? 1,
      screenCenterX: centerScreenX,
      screenCenterY: centerScreenY,
      scaleFactor,
    };

    setActiveDrag('rotate');

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;

      const dx = moveEvent.clientX - session.screenCenterX;
      const dy = moveEvent.clientY - session.screenCenterY;
      // Handle is at top (-PI/2)
      let angleDeg = ((Math.atan2(dy, dx) + Math.PI / 2) * 180) / Math.PI;

      // Normalize to -180 to 180
      if (angleDeg > 180) angleDeg -= 360;
      if (angleDeg < -180) angleDeg += 360;

      // Snapping to 0, 90, 180, -90, 45, -45
      const snapAngles = [0, 90, 180, -90, -180, 45, -45, 135, -135];
      for (const target of snapAngles) {
        if (Math.abs(angleDeg - target) < 3.5) {
          angleDeg = target;
          break;
        }
      }

      setMetricBadge(`Rotation: ${Math.round(angleDeg)}°`);
      updateClipTransform(selectedClip.id, { rotation: Math.round(angleDeg) });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dragSessionRef.current = null;
      setActiveDrag(null);
      setMetricBadge(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Direct Click on Canvas to Select Clip
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = canvasRef.current.clientWidth / baseDim.width;

    const clickCanvasX = (e.clientX - rect.left) / scaleFactor;
    const clickCanvasY = (e.clientY - rect.top) / scaleFactor;

    // Check sorted active clips (top track to bottom track)
    const trackOrderMap = new Map(tracks.map((t, idx) => [t.id, idx]));
    const sortedClips = [...activeClips].sort((a, b) => {
      const orderA = trackOrderMap.get(a.trackId) ?? 0;
      const orderB = trackOrderMap.get(b.trackId) ?? 0;
      return orderA - orderB; // Top tracks first
    });

    for (const clip of sortedClips) {
      if (clip.type !== 'video' && clip.type !== 'image' && clip.type !== 'text') continue;

      const { dw, dh } = getClipBaseSize(clip);
      const scaleX = clip.transform.scaleX !== undefined ? clip.transform.scaleX : clip.transform.scale;
      const scaleY = clip.transform.scaleY !== undefined ? clip.transform.scaleY : clip.transform.scale;
      const width = dw * scaleX;
      const height = dh * scaleY;

      const cx = baseDim.width / 2 + (clip.transform.x || 0);
      const cy = baseDim.height / 2 + (clip.transform.y || 0);
      const rotRad = ((clip.transform.rotation || 0) * Math.PI) / 180;

      // Inverse rotate click point
      const dx = clickCanvasX - cx;
      const dy = clickCanvasY - cy;
      const localX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad);
      const localY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad);

      if (Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2) {
        setSelectedClipId(clip.id);
        return;
      }
    }

    // Clicked empty space
    setSelectedClipId(null);
  };

  if (!selectedClip || !canvasRef.current) {
    return (
      <div
        onClick={handleCanvasClick}
        className="absolute inset-0 pointer-events-auto cursor-default z-20"
      />
    );
  }

  // Calculate screen-relative bounds for selected clip
  const scaleFactor = getScaleFactor();
  const { dw, dh } = getClipBaseSize(selectedClip);
  const baseScaleX = selectedClip.transform.scaleX !== undefined ? selectedClip.transform.scaleX : selectedClip.transform.scale;
  const baseScaleY = selectedClip.transform.scaleY !== undefined ? selectedClip.transform.scaleY : selectedClip.transform.scale;

  const boxWidth = dw * baseScaleX * scaleFactor;
  const boxHeight = dh * baseScaleY * scaleFactor;

  const screenCenterX = (baseDim.width / 2 + (selectedClip.transform.x || 0)) * scaleFactor;
  const screenCenterY = (baseDim.height / 2 + (selectedClip.transform.y || 0)) * scaleFactor;
  const rotation = selectedClip.transform.rotation || 0;

  return (
    <div
      onClick={handleCanvasClick}
      className="absolute inset-0 pointer-events-auto overflow-visible select-none z-20"
    >
      {/* Center Snapping Guide Lines */}
      {snapLines.x && (
        <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-40 pointer-events-none" />
      )}
      {snapLines.y && (
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-40 pointer-events-none" />
      )}

      {/* Floating Metrics Badge */}
      {metricBadge && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 rounded-full border border-blue-500/30 bg-neutral-900/90 px-3 py-1 text-[11px] font-mono font-semibold text-blue-400 shadow-xl backdrop-blur-md animate-in fade-in duration-100">
          {metricBadge}
        </div>
      )}

      {/* Transformed Bounding Box */}
      <div
        style={{
          position: 'absolute',
          left: screenCenterX,
          top: screenCenterY,
          width: Math.max(16, boxWidth),
          height: Math.max(16, boxHeight),
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
        className="pointer-events-auto"
      >
        {/* Box outline */}
        <div
          onPointerDown={handleMovePointerDown}
          className="absolute inset-0 border-2 border-blue-500 dark:border-blue-400 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_12px_rgba(59,130,246,0.35)] cursor-move hover:bg-blue-500/5 transition-colors"
        />

        {/* Rotation handle stem line */}
        <div className="absolute left-1/2 -top-6 h-6 w-0.5 -translate-x-1/2 bg-blue-500 dark:bg-blue-400 pointer-events-none" />

        {/* Top Rotation handle circle */}
        <button
          onPointerDown={handleRotationPointerDown}
          title="Drag to rotate (snaps at 0°, 45°, 90°, 180°)"
          className="absolute left-1/2 -top-6 -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-neutral-900 shadow-md hover:scale-110 active:scale-95 transition cursor-grab"
        >
          <RotateCw className="h-2.5 w-2.5" />
        </button>

        {/* 4 Corner Resize Handles */}
        {/* Top-Left */}
        <button
          onPointerDown={(e) => handleCornerPointerDown('top-left', e)}
          className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow-sm hover:scale-125 cursor-nwse-resize transition"
        />
        {/* Top-Right */}
        <button
          onPointerDown={(e) => handleCornerPointerDown('top-right', e)}
          className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow-sm hover:scale-125 cursor-nesw-resize transition"
        />
        {/* Bottom-Left */}
        <button
          onPointerDown={(e) => handleCornerPointerDown('bottom-left', e)}
          className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow-sm hover:scale-125 cursor-nesw-resize transition"
        />
        {/* Bottom-Right */}
        <button
          onPointerDown={(e) => handleCornerPointerDown('bottom-right', e)}
          className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow-sm hover:scale-125 cursor-nwse-resize transition"
        />

        {/* 4 Edge Handles */}
        {/* Top Edge */}
        <div
          onPointerDown={(e) => handleCornerPointerDown('top', e)}
          className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-5 rounded-full border border-blue-500 bg-white shadow-sm hover:scale-110 cursor-ns-resize transition"
        />
        {/* Bottom Edge */}
        <div
          onPointerDown={(e) => handleCornerPointerDown('bottom', e)}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-5 rounded-full border border-blue-500 bg-white shadow-sm hover:scale-110 cursor-ns-resize transition"
        />
        {/* Left Edge */}
        <div
          onPointerDown={(e) => handleCornerPointerDown('left', e)}
          className="absolute -left-1 top-1/2 -translate-y-1/2 h-5 w-2 rounded-full border border-blue-500 bg-white shadow-sm hover:scale-110 cursor-ew-resize transition"
        />
        {/* Right Edge */}
        <div
          onPointerDown={(e) => handleCornerPointerDown('right', e)}
          className="absolute -right-1 top-1/2 -translate-y-1/2 h-5 w-2 rounded-full border border-blue-500 bg-white shadow-sm hover:scale-110 cursor-ew-resize transition"
        />
      </div>
    </div>
  );
};
