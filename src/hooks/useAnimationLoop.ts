import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { audioEngine } from '@/engine/audioEngine';

/**
 * High-performance animation loop for timeline playback.
 * Does NOT subscribe to playhead to avoid triggering re-render cascades
 * in App or parent components at 60 FPS.
 */
export function useAnimationLoop() {
  const isPlaying = useEditorStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isPlaying) {
      const state = useEditorStore.getState();
      audioEngine.sync(state.playhead, false, state.tracks, state.clips, state.assets);
      return;
    }

    let animId: number;
    let lastTime: number | null = null;

    const loop = (timestamp: number) => {
      if (lastTime === null) {
        lastTime = timestamp;
      }

      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const state = useEditorStore.getState();
      const nextTime = state.playhead + delta;

      if (nextTime >= state.duration) {
        state.setPlayhead(0);
      } else {
        state.setPlayhead(nextTime);
      }

      // Synchronize audio engine
      audioEngine.sync(nextTime, true, state.tracks, state.clips, state.assets);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);
}
