import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export function useKeyboardShortcuts() {
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const splitClip = useEditorStore((s) => s.splitClip);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const playhead = useEditorStore((s) => s.playhead);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Space -> Toggle Playback
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }

      // S -> Split Selected Clip at Playhead
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        if (selectedClipId) {
          e.preventDefault();
          splitClip(selectedClipId);
        }
      }

      // Delete or Backspace -> Delete Selected Clip
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          deleteClip(selectedClipId);
        }
      }

      // Arrow Left / Right -> Step 1 Frame (1/30s) or 1 second with Shift
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / 30;
        setPlayhead(playhead - step);
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / 30;
        setPlayhead(playhead + step);
      }

      // Ctrl + Z -> Undo
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl + Y or Ctrl + Shift + Z -> Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, selectedClipId, deleteClip, splitClip, undo, redo, playhead, setPlayhead]);
}
