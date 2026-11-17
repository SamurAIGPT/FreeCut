import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { audioEngine } from '@/engine/audioEngine';

export function useAnimationLoop() {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const playhead = useEditorStore((s) => s.playhead);
  const duration = useEditorStore((s) => s.duration);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);

  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        const nextTime = playhead + delta;
        if (nextTime >= duration) {
          setPlayhead(0); // Loop to start
        } else {
          setPlayhead(nextTime);
        }
      }

      // Synchronize audio engine
      audioEngine.sync(playhead, isPlaying, tracks, clips, assets);

      animId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      lastTimeRef.current = null;
      animId = requestAnimationFrame(loop);
    } else {
      audioEngine.sync(playhead, false, tracks, clips, assets);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, playhead, duration, setPlayhead, setIsPlaying, tracks, clips, assets]);
}
