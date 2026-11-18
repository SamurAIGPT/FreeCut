import React from 'react';
import { 
  Eye, EyeOff, Film, Lock, Music, Type, Unlock, 
  Volume2, VolumeX, Trash2 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Track } from '@/types/editor';

interface TrackHeaderProps {
  track: Track;
  index: number;
  totalTracks: number;
}

export const TrackHeader: React.FC<TrackHeaderProps> = React.memo(({ track, totalTracks }) => {
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute);
  const toggleTrackLock = useEditorStore((s) => s.toggleTrackLock);
  const toggleTrackVisibility = useEditorStore((s) => s.toggleTrackVisibility);
  const toggleTrackSolo = useEditorStore((s) => s.toggleTrackSolo);
  const deleteTrack = useEditorStore((s) => s.deleteTrack);

  return (
    <div 
      style={{ height: '40px' }}
      className="group relative flex w-60 shrink-0 items-center justify-between border-b border-neutral-200 bg-white dark:border-[#222226] dark:bg-[#0a0a0a] px-2.5 select-none transition-colors duration-150"
    >
      {/* Left: Track Type Icon & Name */}
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-1.5">
        <span
          className={`shrink-0 ${
            track.type === 'video'
              ? 'text-blue-600 dark:text-blue-400'
              : track.type === 'audio'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {track.type === 'video' ? (
            <Film className="h-3.5 w-3.5" />
          ) : track.type === 'audio' ? (
            <Music className="h-3.5 w-3.5" />
          ) : (
            <Type className="h-3.5 w-3.5" />
          )}
        </span>

        <span
          className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-none"
          title={track.name}
        >
          {track.name}
        </span>
      </div>

      {/* Right: Clean, Flat, Minimal Action Buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Solo */}
        <button
          onClick={() => toggleTrackSolo(track.id)}
          title="Solo Track (S)"
          className={`h-5 w-5 rounded text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
            track.isSolo
              ? 'bg-amber-500 text-black shadow-xs'
              : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-neutral-800'
          }`}
        >
          S
        </button>

        {/* Mute (Audio / Video) */}
        {track.type !== 'text' && (
          <button
            onClick={() => toggleTrackMute(track.id)}
            title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
            className={`h-5 w-5 rounded flex items-center justify-center transition cursor-pointer ${
              track.isMuted
                ? 'bg-red-500/15 text-red-500'
                : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-neutral-800'
            }`}
          >
            {track.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
        )}

        {/* Visibility */}
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          title={track.isVisible === false ? 'Show Track' : 'Hide Track'}
          className={`h-5 w-5 rounded flex items-center justify-center transition cursor-pointer ${
            track.isVisible === false
              ? 'bg-red-500/15 text-red-500'
              : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-neutral-800'
          }`}
        >
          {track.isVisible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>

        {/* Lock */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
          className={`h-5 w-5 rounded flex items-center justify-center transition cursor-pointer ${
            track.isLocked
              ? 'bg-amber-500/15 text-amber-500'
              : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-neutral-800'
          }`}
        >
          {track.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>

        {/* Delete Track (visible on hover) */}
        {totalTracks > 1 && (
          <button
            onClick={() => deleteTrack(track.id)}
            title="Delete Track"
            className="h-5 w-5 rounded flex items-center justify-center text-neutral-400 hover:bg-red-500/15 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer ml-0.5"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});

export default TrackHeader;
