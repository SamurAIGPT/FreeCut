import React from 'react';
import { Header } from '@/components/header/Header';
import { AssetsPanel } from '@/components/assets/AssetsPanel';
import { PreviewCanvas } from '@/components/preview/PreviewCanvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { Timeline } from '@/components/timeline/Timeline';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAnimationLoop } from '@/hooks/useAnimationLoop';

interface EditorWorkspaceProps {
  onBackToProjects?: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ onBackToProjects }) => {
  useKeyboardShortcuts();
  useAnimationLoop();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-app-bg text-app-text select-none transition-colors duration-200">
      {/* Top Application Header */}
      <Header onBackToProjects={onBackToProjects} />

      {/* Main Studio Workspace */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <AssetsPanel />
        <PreviewCanvas />
        <InspectorPanel />
      </div>

      {/* Bottom Multi-Track Pro Timeline */}
      <Timeline />
    </div>
  );
};
