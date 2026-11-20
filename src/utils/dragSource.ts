/**
 * Timeline Drag and Drop Source
 * Manages active drag session payload across the application.
 */

export type TimelineDragType = 'media' | 'audio' | 'text' | 'sticker' | 'effect' | 'transition';

export interface TimelineDragData {
  type: TimelineDragType;
  id?: string;
  name: string;
  duration?: number;
  mediaType?: 'video' | 'audio' | 'image';
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  payload?: any;
}

export const TIMELINE_DRAG_MIME = 'application/x-freecut-drag';

class TimelineDragSource {
  private activeData: TimelineDragData | null = null;

  begin(data: TimelineDragData, event?: React.DragEvent | DragEvent): void {
    this.activeData = data;
    if (event?.dataTransfer) {
      try {
        event.dataTransfer.setData(TIMELINE_DRAG_MIME, JSON.stringify(data));
        event.dataTransfer.setData('text/plain', data.name);
        event.dataTransfer.effectAllowed = 'copy';
      } catch {
        // Fallback for browsers with restricted dataTransfer
      }
    }
  }

  end(): void {
    this.activeData = null;
  }

  getActive(): TimelineDragData | null {
    return this.activeData;
  }

  isActive(): boolean {
    return this.activeData !== null;
  }
}

const globalSource =
  typeof window !== 'undefined' && (window as any).__timelineDragSource
    ? (window as any).__timelineDragSource
    : new TimelineDragSource();

if (typeof window !== 'undefined') {
  (window as any).__timelineDragSource = globalSource;
}

export const timelineDragSource = globalSource;
