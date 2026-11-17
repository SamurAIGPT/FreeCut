import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { compositor } from '@/engine/compositor';
import { TransportBar } from './TransportBar';

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playhead = useEditorStore((s) => s.playhead);
  const aspect = useEditorStore((s) => s.aspectRatio);
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);

  // Re-render canvas whenever playhead, aspect, clips, or tracks update
  useEffect(() => {
    if (canvasRef.current) {
      compositor.render(canvasRef.current, playhead, aspect, tracks, clips, assets);
    }
  }, [playhead, aspect, tracks, clips, assets]);

  // Compute container aspect ratio class
  const getAspectClass = () => {
    switch (aspect) {
      case '9:16':
        return 'aspect-[9/16] max-h-[85%]';
      case '1:1':
        return 'aspect-square max-h-[85%]';
      case '16:9':
      default:
        return 'aspect-video max-w-[90%] max-h-[85%]';
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0c0f]">
      {/* Canvas Viewport */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div
          className={`relative flex items-center justify-center rounded-lg border border-border/80 bg-black shadow-2xl shadow-black/80 overflow-hidden ${getAspectClass()}`}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full object-contain"
          />

          {/* Active selection indicator banner */}
          {selectedClipId && (
            <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-blue-400 backdrop-blur-sm">
              Clip Selected • Adjust in Inspector
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls Bar */}
      <TransportBar />
    </div>
  );
};
