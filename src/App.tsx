import React, { useEffect } from 'react';
import { Header } from '@/components/header/Header';
import { AssetsPanel } from '@/components/assets/AssetsPanel';
import { PreviewCanvas } from '@/components/preview/PreviewCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { Timeline } from '@/components/timeline/Timeline';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAnimationLoop } from '@/hooks/useAnimationLoop';
import { useEditorStore } from '@/store/useEditorStore';
import { generateCountdownVideo, generateSampleAudio } from '@/utils/sampleMedia';

export const App: React.FC = () => {
  useKeyboardShortcuts();
  useAnimationLoop();

  const assets = useEditorStore((s) => s.assets);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);

  // Auto-seed initial sample footage once so the editor is immediately playable out of the box
  useEffect(() => {
    if (assets.length === 0) {
      const initSamples = async () => {
        try {
          const videoAsset = await generateCountdownVideo();
          addAsset(videoAsset);

          const audioAsset = await generateSampleAudio();
          addAsset(audioAsset);

          const videoTrack = tracks.find((t) => t.type === 'video');
          const audioTrack = tracks.find((t) => t.type === 'audio');
          const textTrack = tracks.find((t) => t.type === 'text');

          if (videoTrack) {
            addClip({
              trackId: videoTrack.id,
              assetId: videoAsset.id,
              name: 'Sample Footage.webm',
              type: 'video',
              start: 0,
              duration: 5,
              trimStart: 0,
              trimEnd: 5,
              transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
              volume: 1,
              color: '#3b82f6',
            });
          }

          if (audioTrack) {
            addClip({
              trackId: audioTrack.id,
              assetId: audioAsset.id,
              name: 'Synth Chords.wav',
              type: 'audio',
              start: 0,
              duration: 5,
              trimStart: 0,
              trimEnd: 5,
              transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
              volume: 0.8,
              color: '#10b981',
            });
          }

          if (textTrack) {
            addClip({
              trackId: textTrack.id,
              name: 'FreeCut Intro',
              type: 'text',
              text: 'Welcome to FreeCut',
              fontSize: 48,
              fontColor: '#38bdf8',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              fontFamily: 'Inter, system-ui',
              start: 0.5,
              duration: 4,
              trimStart: 0,
              trimEnd: 4,
              transform: { x: 0, y: -160, scale: 1, rotation: 0, opacity: 1 },
              volume: 0,
              color: '#f59e0b',
            });
          }
        } catch (err) {
          console.error('Failed to init sample media:', err);
        }
      };

      initSamples();
    }
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Application Bar */}
      <Header />

      {/* Main Workspace (Assets / Viewport / Inspector) */}
      <div className="flex flex-1 overflow-hidden">
        <AssetsPanel />
        <PreviewCanvas />
        <InspectorPanel />
      </div>

      {/* Bottom Multi-Track Timeline */}
      <Timeline />
    </div>
  );
};

export default App;
