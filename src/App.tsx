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

  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const assets = useEditorStore((s) => s.assets);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);

  // Sync theme with document element on startup
  useEffect(() => {
    setTheme(theme);
  }, []);

  // Auto-seed sequence on first visit
  useEffect(() => {
    if (assets.length === 0) {
      const initSamples = async () => {
        try {
          const videoAsset = await generateCountdownVideo();
          addAsset(videoAsset);

          const audioAsset = await generateSampleAudio();
          addAsset(audioAsset);

          const textTrack = tracks.find((t) => t.type === 'text') || tracks[0];
          const mainVideoTrack = tracks.find((t) => t.id === 'track-video-1') || tracks[1];
          const bRollTrack = tracks.find((t) => t.id === 'track-video-2') || tracks[1];
          const audioTrack = tracks.find((t) => t.id === 'track-audio-1') || tracks[2];

          // 1. Main Background Video
          if (mainVideoTrack) {
            addClip({
              trackId: mainVideoTrack.id,
              assetId: videoAsset.id,
              name: 'Cinematic Countdown.webm',
              type: 'video',
              start: 0,
              duration: 5,
              trimStart: 0,
              trimEnd: 5,
              transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
              volume: 1,
              color: '#2563eb',
            });
          }

          // 2. Overlay B-Roll Cut
          if (bRollTrack) {
            addClip({
              trackId: bRollTrack.id,
              assetId: videoAsset.id,
              name: 'Picture-in-Picture.webm',
              type: 'video',
              start: 2,
              duration: 3,
              trimStart: 2,
              trimEnd: 5,
              transform: { x: 380, y: -190, scale: 0.35, rotation: 0, opacity: 0.95 },
              volume: 0,
              color: '#4f46e5',
            });
          }

          // 3. Audio Soundtrack
          if (audioTrack) {
            addClip({
              trackId: audioTrack.id,
              assetId: audioAsset.id,
              name: 'Lo-Fi Ambient Beat.wav',
              type: 'audio',
              start: 0,
              duration: 5,
              trimStart: 0,
              trimEnd: 5,
              transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
              volume: 0.85,
              color: '#059669',
            });
          }

          // 4. Stylized Title Card
          if (textTrack) {
            addClip({
              trackId: textTrack.id,
              name: 'Obsidian Title',
              type: 'text',
              text: 'FREECUT PRO',
              fontSize: 56,
              fontColor: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              fontFamily: 'Inter, system-ui',
              start: 0.5,
              duration: 4.5,
              trimStart: 0,
              trimEnd: 4.5,
              transform: { x: 0, y: 160, scale: 1, rotation: 0, opacity: 1 },
              volume: 0,
              color: '#d97706',
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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-app-bg text-app-text select-none transition-colors duration-200">
      {/* Top Application Header */}
      <Header />

      {/* Main Studio Workspace */}
      <div className="flex flex-1 overflow-hidden">
        <AssetsPanel />
        <PreviewCanvas />
        <InspectorPanel />
      </div>

      {/* Bottom Multi-Track Pro Timeline */}
      <Timeline />
    </div>
  );
};

export default App;
