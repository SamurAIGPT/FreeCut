import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export function useKeyboardShortcuts() {
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const rippleDelete = useEditorStore((s) => s.rippleDelete);
  const splitClip = useEditorStore((s) => s.splitClip);
  const splitLeft = useEditorStore((s) => s.splitLeft);
  const splitRight = useEditorStore((s) => s.splitRight);
  const duplicateClip = useEditorStore((s) => s.duplicateClip);
  const addMarker = useEditorStore((s) => s.addMarker);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
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

      // Tool Switching (V = Select, C = Razor)
      if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('select');
      }
      if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('razor');
      }

      // S -> Split Selected Clip at Playhead
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        if (selectedClipId) {
          e.preventDefault();
          splitClip(selectedClipId);
        }
      }

      // Q -> Split Left (Trim start to playhead)
      if (e.code === 'KeyQ' && !e.ctrlKey && !e.metaKey) {
        if (selectedClipId) {
          e.preventDefault();
          splitLeft(selectedClipId);
        }
      }

      // W -> Split Right (Trim end to playhead)
      if (e.code === 'KeyW' && !e.ctrlKey && !e.metaKey) {
        if (selectedClipId) {
          e.preventDefault();
          splitRight(selectedClipId);
        }
      }

      // M -> Add Marker at playhead
      if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        addMarker(playhead);
      }

      // Ctrl + D -> Duplicate Selected Clip
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
        if (selectedClipId) {
          e.preventDefault();
          duplicateClip(selectedClipId);
        }
      }

      // Delete or Backspace -> Delete Selected Clip (or Shift+Del for Ripple Delete)
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          if (e.shiftKey) {
            rippleDelete(selectedClipId);
          } else {
            deleteClip(selectedClipId);
          }
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
